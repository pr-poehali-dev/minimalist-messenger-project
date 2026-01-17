import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для управления профилем пользователя"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
            
            if action == 'get_profile':
                profile_user_id = params.get('user_id', user_id)
                
                cur.execute("""
                    SELECT id, username, display_name, avatar_url, banner_url, bio, status, status_emoji,
                           is_online, ghost_mode, has_verification, balance, raccoon_coins, created_at, last_seen
                    FROM users WHERE id = %s
                """, (profile_user_id,))
                
                user = cur.fetchone()
                if user:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'id': user[0],
                            'username': user[1],
                            'display_name': user[2],
                            'avatar_url': user[3],
                            'banner_url': user[4],
                            'bio': user[5],
                            'status': user[6],
                            'status_emoji': user[7],
                            'is_online': user[8] and not user[9],
                            'has_verification': user[10],
                            'balance': float(user[11]) if user[11] else 0,
                            'raccoon_coins': user[12],
                            'created_at': user[13].isoformat() if user[13] else None,
                            'last_seen': user[14].isoformat() if user[14] else None
                        })
                    }
            
            elif action == 'search_users':
                query = params.get('query', '')
                
                cur.execute("""
                    SELECT id, username, display_name, avatar_url, has_verification
                    FROM users
                    WHERE username ILIKE %s OR display_name ILIKE %s
                    LIMIT 50
                """, (f'%{query}%', f'%{query}%'))
                
                users = []
                for row in cur.fetchall():
                    users.append({
                        'id': row[0],
                        'username': row[1],
                        'display_name': row[2],
                        'avatar_url': row[3],
                        'has_verification': row[4]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users})
                }
            
            elif action == 'get_friends':
                cur.execute("""
                    SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_online, u.ghost_mode, f.status
                    FROM friends f
                    JOIN users u ON (f.friend_id = u.id AND f.user_id = %s) OR (f.user_id = u.id AND f.friend_id = %s)
                    WHERE (f.user_id = %s OR f.friend_id = %s) AND f.status = 'accepted'
                """, (user_id, user_id, user_id, user_id))
                
                friends = []
                for row in cur.fetchall():
                    friends.append({
                        'id': row[0],
                        'username': row[1],
                        'display_name': row[2],
                        'avatar_url': row[3],
                        'is_online': row[4] and not row[5]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'friends': friends})
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'update_profile':
                fields = []
                values = []
                
                if 'username' in body:
                    fields.append('username = %s')
                    values.append(body['username'])
                if 'display_name' in body:
                    fields.append('display_name = %s')
                    values.append(body['display_name'])
                if 'avatar_url' in body:
                    fields.append('avatar_url = %s')
                    values.append(body['avatar_url'])
                if 'banner_url' in body:
                    fields.append('banner_url = %s')
                    values.append(body['banner_url'])
                if 'bio' in body:
                    fields.append('bio = %s')
                    values.append(body['bio'])
                if 'status' in body:
                    fields.append('status = %s')
                    values.append(body['status'])
                if 'status_emoji' in body:
                    fields.append('status_emoji = %s')
                    values.append(body['status_emoji'])
                if 'ghost_mode' in body:
                    fields.append('ghost_mode = %s')
                    values.append(body['ghost_mode'])
                
                values.append(user_id)
                
                cur.execute(
                    f"UPDATE users SET {', '.join(fields)} WHERE id = %s",
                    tuple(values)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'add_friend':
                friend_id = body.get('friend_id')
                
                cur.execute(
                    "INSERT INTO friends (user_id, friend_id, status) VALUES (%s, %s, 'pending')",
                    (user_id, friend_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'accept_friend':
                friend_id = body.get('friend_id')
                
                cur.execute(
                    "UPDATE friends SET status = 'accepted' WHERE user_id = %s AND friend_id = %s",
                    (friend_id, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'buy_verification':
                cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
                balance = cur.fetchone()[0]
                
                if balance >= 5000:
                    cur.execute(
                        "UPDATE users SET has_verification = TRUE, balance = balance - 5000 WHERE id = %s",
                        (user_id,)
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
