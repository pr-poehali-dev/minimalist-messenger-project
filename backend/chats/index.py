import json
import os
import psycopg2
import boto3
import base64
import uuid
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для управления чатами и сообщениями"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-User-Id'
            },
            'body': ''
        }
    
    db_url = os.environ['DATABASE_URL']
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    try:
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action')
            
            if action == 'list_chats':
                cur.execute("""
                    SELECT c.id, c.type, c.name, c.avatar_url, c.created_at,
                           (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                           (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND is_read = FALSE AND sender_id != %s) as unread_count
                    FROM chats c
                    JOIN chat_members cm ON c.id = cm.chat_id
                    WHERE cm.user_id = %s AND cm.is_blocked = FALSE
                    ORDER BY c.created_at DESC
                """, (user_id, user_id))
                
                chats = []
                for row in cur.fetchall():
                    chats.append({
                        'id': row[0],
                        'type': row[1],
                        'name': row[2],
                        'avatar_url': row[3],
                        'created_at': row[4].isoformat() if row[4] else None,
                        'last_message': row[5],
                        'unread_count': row[6]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chats': chats})
                }
            
            elif action == 'get_messages':
                chat_id = params.get('chat_id')
                
                cur.execute("""
                    SELECT m.id, m.sender_id, u.username, u.display_name, u.avatar_url,
                           m.content, m.message_type, m.file_url, m.duration, m.reply_to, m.is_read, m.is_edited, m.created_at
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (chat_id,))
                
                messages = []
                for row in cur.fetchall():
                    msg = {
                        'id': row[0],
                        'sender_id': row[1],
                        'sender_username': row[2],
                        'sender_name': row[3],
                        'sender_avatar': row[4],
                        'content': row[5],
                        'message_type': row[6],
                        'file_url': row[7],
                        'duration': row[8],
                        'reply_to': row[9],
                        'is_read': row[10],
                        'is_edited': row[11],
                        'created_at': row[12].isoformat() if row[12] else None
                    }
                    
                    cur.execute("""
                        SELECT emoji, COUNT(*) as count
                        FROM message_reactions
                        WHERE message_id = %s
                        GROUP BY emoji
                    """, (row[0],))
                    msg['reactions'] = [{'emoji': r[0], 'count': r[1]} for r in cur.fetchall()]
                    
                    messages.append(msg)
                
                cur.execute("UPDATE messages SET is_read = TRUE WHERE chat_id = %s AND sender_id != %s", (chat_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages})
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_chat':
                chat_type = body.get('type')
                name = body.get('name')
                members = body.get('members', [])
                
                cur.execute(
                    "INSERT INTO chats (type, name, created_by) VALUES (%s, %s, %s) RETURNING id",
                    (chat_type, name, user_id)
                )
                chat_id = cur.fetchone()[0]
                
                cur.execute(
                    "INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s, %s, 'owner')",
                    (chat_id, user_id)
                )
                
                for member_id in members:
                    cur.execute(
                        "INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)",
                        (chat_id, member_id)
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'chat_id': chat_id})
                }
            
            elif action == 'send_message':
                chat_id = body.get('chat_id')
                content = body.get('content')
                message_type = body.get('message_type', 'text')
                file_url = body.get('file_url')
                file_data = body.get('file_data')
                file_type = body.get('file_type')
                duration = body.get('duration')
                reply_to = body.get('reply_to')
                
                if file_data:
                    file_bytes = base64.b64decode(file_data)
                    file_ext = 'jpg' if 'image' in file_type else 'ogg'
                    unique_name = f"{uuid.uuid4()}.{file_ext}"
                    key = f"uploads/{datetime.now().year}/{datetime.now().month}/{unique_name}"
                    
                    s3.put_object(
                        Bucket='files',
                        Key=key,
                        Body=file_bytes,
                        ContentType=file_type
                    )
                    
                    file_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
                
                cur.execute(
                    "INSERT INTO messages (chat_id, sender_id, content, message_type, file_url, duration, reply_to) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at",
                    (chat_id, user_id, content, message_type, file_url, duration, reply_to)
                )
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': result[0],
                        'created_at': result[1].isoformat()
                    })
                }
            
            elif action == 'add_reaction':
                message_id = body.get('message_id')
                emoji = body.get('emoji')
                
                cur.execute(
                    "INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (%s, %s, %s) ON CONFLICT (message_id, user_id, emoji) DO NOTHING",
                    (message_id, user_id, emoji)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action')
            
            if action == 'clear_chat':
                chat_id = params.get('chat_id')
                cur.execute("UPDATE messages SET content = '', message_type = 'text' WHERE chat_id = %s AND sender_id = %s", (chat_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()