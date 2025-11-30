"""Test MCP Server Client"""
import asyncio
import httpx
import json

async def test_mcp():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Initialize session
        init_req = {
            'jsonrpc': '2.0',
            'method': 'initialize',
            'params': {
                'protocolVersion': '2024-11-05',
                'capabilities': {},
                'clientInfo': {'name': 'test', 'version': '1.0'}
            },
            'id': 1
        }
        
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}
        
        resp = await client.post('http://localhost:3002/mcp', json=init_req, headers=headers)
        print('=== INITIALIZE ===')
        print(f'Status: {resp.status_code}')
        
        # Get session ID from response header
        session_id = resp.headers.get('mcp-session-id')
        print(f'Session ID: {session_id}')
        
        if session_id:
            # Test tools/list with session
            headers['mcp-session-id'] = session_id
            tools_req = {'jsonrpc': '2.0', 'method': 'tools/list', 'id': 2}
            resp = await client.post('http://localhost:3002/mcp', json=tools_req, headers=headers)
            print('\n=== TOOLS LIST ===')
            data = resp.json()
            if 'result' in data and 'tools' in data['result']:
                for tool in data['result']['tools']:
                    print(f"  - {tool['name']}")
            else:
                print(data)
            
            # Test list_projects tool
            call_req = {
                'jsonrpc': '2.0',
                'method': 'tools/call',
                'params': {
                    'name': 'list_projects',
                    'arguments': {}
                },
                'id': 3
            }
            resp = await client.post('http://localhost:3002/mcp', json=call_req, headers=headers)
            print('\n=== LIST PROJECTS ===')
            data = resp.json()
            if 'result' in data:
                content = data['result'].get('content', [])
                if content:
                    text = content[0].get('text', '')
                    print(text[:2000])
            else:
                print(data)
            
            # Test brain_stats tool
            brain_req = {
                'jsonrpc': '2.0',
                'method': 'tools/call',
                'params': {
                    'name': 'brain_stats',
                    'arguments': {}
                },
                'id': 4
            }
            resp = await client.post('http://localhost:3002/mcp', json=brain_req, headers=headers)
            print('\n=== BRAIN STATS ===')
            data = resp.json()
            if 'result' in data:
                content = data['result'].get('content', [])
                if content:
                    text = content[0].get('text', '')
                    print(text)
            else:
                print(data)
        else:
            print('ERROR: No session ID received')
            print(resp.text)

if __name__ == '__main__':
    asyncio.run(test_mcp())
