// ファイル名: app/api/send-push+api.ts

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ここでサーバー側からExpoに通知を送る（CORS制限を受けない）
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return Response.json(data);
    
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}