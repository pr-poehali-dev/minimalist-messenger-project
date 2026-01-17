import json
import os
import psycopg2
import hashlib
import random
import string
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """API для регистрации и авторизации пользователей"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    db_url = os.environ['DATABASE_URL']
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'send_code':
                phone = body.get('phone')
                code = ''.join(random.choices(string.digits, k=6))
                expires_at = datetime.now() + timedelta(minutes=5)
                
                cur.execute(
                    "INSERT INTO sms_codes (phone, code, expires_at) VALUES (%s, %s, %s)",
                    (phone, code, expires_at)
                )
                conn.commit()
                
                # В реальной версии здесь будет отправка SMS
                # import requests
                # sms_api_key = os.environ.get('SMS_API_KEY')
                # requests.post(f'https://sms.ru/sms/send?api_id={sms_api_key}&to={phone}&msg={code}')
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'dev_code': code})
                }
            
            elif action == 'verify_code':
                phone = body.get('phone')
                code = body.get('code')
                
                cur.execute(
                    "SELECT id FROM sms_codes WHERE phone = %s AND code = %s AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1",
                    (phone, code)
                )
                result = cur.fetchone()
                
                if result:
                    cur.execute("UPDATE sms_codes SET is_used = TRUE WHERE id = %s", (result[0],))
                    conn.commit()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'verified': True})
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Invalid code'})
                    }
            
            elif action == 'register':
                phone = body.get('phone')
                username = body.get('username')
                display_name = body.get('display_name')
                password = body.get('password')
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cur.execute(
                    "INSERT INTO users (phone, username, display_name, password_hash) VALUES (%s, %s, %s, %s) RETURNING id, username, display_name",
                    (phone, username, display_name, password_hash)
                )
                user = cur.fetchone()
                
                # Создаем чат "Сохраненные сообщения"
                cur.execute(
                    "INSERT INTO chats (type, name, created_by) VALUES ('saved', 'Сохраненные сообщения', %s) RETURNING id",
                    (user[0],)
                )
                saved_chat_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s, %s, 'owner')",
                    (saved_chat_id, user[0])
                )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': {
                            'id': user[0],
                            'username': user[1],
                            'display_name': user[2]
                        }
                    })
                }
            
            elif action == 'login':
                phone = body.get('phone')
                password = body.get('password')
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cur.execute(
                    "SELECT id, username, display_name, avatar_url, banner_url, bio, status, status_emoji, has_verification, balance, raccoon_coins FROM users WHERE phone = %s AND password_hash = %s",
                    (phone, password_hash)
                )
                user = cur.fetchone()
                
                if user:
                    cur.execute("UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE id = %s", (user[0],))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'user': {
                                'id': user[0],
                                'username': user[1],
                                'display_name': user[2],
                                'avatar_url': user[3],
                                'banner_url': user[4],
                                'bio': user[5],
                                'status': user[6],
                                'status_emoji': user[7],
                                'has_verification': user[8],
                                'balance': float(user[9]) if user[9] else 0,
                                'raccoon_coins': user[10]
                            }
                        })
                    }
                else:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Invalid credentials'})
                    }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
