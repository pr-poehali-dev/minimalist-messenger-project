import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для магазина подарков и кошелька"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    db_url = os.environ['DATABASE_URL']
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action')
            
            if action == 'get_gifts':
                cur.execute("""
                    SELECT id, name, emoji, price, category
                    FROM shop_gifts
                    WHERE is_active = TRUE
                    ORDER BY category, price
                """)
                
                gifts = []
                for row in cur.fetchall():
                    gifts.append({
                        'id': row[0],
                        'name': row[1],
                        'emoji': row[2],
                        'price': row[3],
                        'category': row[4]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'gifts': gifts})
                }
            
            elif action == 'my_gifts':
                cur.execute("""
                    SELECT ug.id, sg.name, sg.emoji, sg.price, u.username, ug.quantity, ug.received_at
                    FROM user_gifts ug
                    JOIN shop_gifts sg ON ug.gift_id = sg.id
                    LEFT JOIN users u ON ug.sender_id = u.id
                    WHERE ug.user_id = %s
                    ORDER BY ug.received_at DESC
                """, (user_id,))
                
                my_gifts = []
                for row in cur.fetchall():
                    my_gifts.append({
                        'id': row[0],
                        'name': row[1],
                        'emoji': row[2],
                        'price': row[3],
                        'sender': row[4],
                        'quantity': row[5],
                        'received_at': row[6].isoformat() if row[6] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'gifts': my_gifts})
                }
            
            elif action == 'get_balance':
                cur.execute("SELECT balance, raccoon_coins FROM users WHERE id = %s", (user_id,))
                result = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'balance': float(result[0]) if result[0] else 0,
                        'raccoon_coins': result[1]
                    })
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'buy_gift':
                gift_id = body.get('gift_id')
                
                cur.execute("SELECT price FROM shop_gifts WHERE id = %s", (gift_id,))
                price = cur.fetchone()[0]
                
                cur.execute("SELECT raccoon_coins FROM users WHERE id = %s", (user_id,))
                raccoon_coins = cur.fetchone()[0]
                
                if raccoon_coins >= price:
                    cur.execute(
                        "UPDATE users SET raccoon_coins = raccoon_coins - %s WHERE id = %s",
                        (price, user_id)
                    )
                    cur.execute(
                        "INSERT INTO user_gifts (user_id, gift_id, sender_id) VALUES (%s, %s, %s)",
                        (user_id, gift_id, user_id)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True})
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Not enough raccoon coins'})
                    }
            
            elif action == 'send_gift':
                gift_user_gift_id = body.get('user_gift_id')
                receiver_id = body.get('receiver_id')
                
                cur.execute(
                    "UPDATE user_gifts SET user_id = %s, sender_id = %s WHERE id = %s AND user_id = %s",
                    (receiver_id, user_id, gift_user_gift_id, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'buy_raccoon_coins':
                amount = body.get('amount')
                
                cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
                balance = cur.fetchone()[0]
                
                if balance >= amount:
                    bonus = int(amount * 0.1)
                    cur.execute(
                        "UPDATE users SET balance = balance - %s, raccoon_coins = raccoon_coins + %s + %s WHERE id = %s",
                        (amount, amount, bonus, user_id)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'received': amount + bonus})
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Insufficient balance'})
                    }
            
            elif action == 'add_balance':
                amount = body.get('amount')
                
                cur.execute(
                    "UPDATE users SET balance = balance + %s WHERE id = %s",
                    (amount, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'send_money':
                receiver_id = body.get('receiver_id')
                amount = body.get('amount')
                
                cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
                balance = cur.fetchone()[0]
                
                if balance >= amount:
                    cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (amount, user_id))
                    cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (amount, receiver_id))
                    cur.execute(
                        "INSERT INTO transactions (from_user_id, to_user_id, amount, transaction_type) VALUES (%s, %s, %s, 'money')",
                        (user_id, receiver_id, amount)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True})
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Insufficient balance'})
                    }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
