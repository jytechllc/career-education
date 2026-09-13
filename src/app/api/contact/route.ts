import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, phone, message } = await request.json();

  if (!name || !email || !phone || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.REVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: { name: "杰圆职场教育", email: "helen.lan@jytech.us" },
        to: [
          { email: "carrie.lan998@gmail.com", name: "Carrie" },
          { email: "weijingjaylin+careereducation@gmail.com", name: "Jay" },
        ],
        replyTo: { email, name },
        subject: `新咨询预约: ${name}`,
        htmlContent: `
          <h2>新的咨询预约</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px">
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">姓名</td><td style="padding:8px;border-bottom:1px solid #eee">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">邮箱</td><td style="padding:8px;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">电话</td><td style="padding:8px;border-bottom:1px solid #eee">${phone}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">咨询内容</td><td style="padding:8px">${message}</td></tr>
          </table>
          <p style="color:#999;font-size:12px;margin-top:20px">此邮件由 edu.jytech.us 网站自动发送</p>
        `,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Brevo API error:", res.status, detail);
      return NextResponse.json(
        { error: "Failed to send email", detail },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", detail: String(error) },
      { status: 500 }
    );
  }
}
