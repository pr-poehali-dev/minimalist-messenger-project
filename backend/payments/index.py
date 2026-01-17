import json
import os
import psycopg2
import uuid
from yookassa import Configuration, Payment

def handler(event: dict, context) -> dict:
    """API для приема платежей через ЮKassa"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    Configuration.account_id = os.environ.get('YOOKASSA_SHOP_ID')
    Configuration.secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
    
    db_url = os.environ['DATABASE_URL']
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_payment':
                amount = body.get('amount')
                
                payment = Payment.create({
                    "amount": {
                        "value": str(amount),
                        "currency": "RUB"
                    },
                    "confirmation": {
                        "type": "redirect",
                        "return_url": body.get('return_url', 'https://speakly.app')
                    },
                    "capture": True,
                    "description": f"Пополнение баланса Speakly",
                    "metadata": {
                        "user_id": str(user_id)
                    }
                }, uuid.uuid4())
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'payment_id': payment.id,
                        'confirmation_url': payment.confirmation.confirmation_url
                    })
                }
            
            elif action == 'check_payment':
                payment_id = body.get('payment_id')
                
                payment = Payment.find_one(payment_id)
                
                if payment.status == 'succeeded':
                    amount = float(payment.amount.value)
                    user_id = int(payment.metadata.get('user_id'))
                    
                    cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
                    current_balance = cur.fetchone()
                    
                    if current_balance:
                        cur.execute(
                            "UPDATE users SET balance = balance + %s WHERE id = %s",
                            (amount, user_id)
                        )
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'success': True,
                                'status': 'succeeded',
                                'amount': amount
                            })
                        }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'status': payment.status
                    })
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
