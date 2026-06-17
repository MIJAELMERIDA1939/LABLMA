import asyncio, httpx

async def test():
    async with httpx.AsyncClient(follow_redirects=True) as c:
        r = await c.post('http://localhost:8000/api/v1/auth/login', json={'email':'admin@sgc.local','password':'Admin1234!'})
        token = r.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        r = await c.get('http://localhost:8000/api/v1/documentos?search=SOP-05&limit=5&offset=0', headers=headers)
        doc_id = r.json()['items'][0]['id']

        r = await c.get(f'http://localhost:8000/api/v1/documentos/{doc_id}/workflow', headers=headers)
        print(f'Workflow status: {r.status_code}')
        if r.status_code == 200:
            print(f'Workflow: {r.json()}')
        else:
            print(f'Error: {r.text}')

asyncio.run(test())
