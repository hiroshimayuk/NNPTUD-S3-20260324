const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: process.env.MAILTRAP_USER || "",
        pass: process.env.MAILTRAP_PASS || "",
    },
});

module.exports = {
    sendMail: async (to, url) => {
        const info = await transporter.sendMail({
            from: 'Admin@hahah.com',
            to: to,
            subject: "request resetpassword email",
            text: "click vao day de reset", // Plain-text version of the message
            html: "click vao <a href=" + url + ">day</a> de reset", // HTML version of the message
        });
        console.log("Message sent:", info.messageId);
    },

    sendPasswordEmail: async (to, username, password) => {
        const info = await transporter.sendMail({
            from: '"Admin NNPTUD" <admin@haha.com>',
            to: to,
            subject: "🎉 Tài khoản của bạn đã được tạo",
            text: `Xin chào ${username},\n\nTài khoản của bạn đã được tạo thành công.\nMật khẩu: ${password}\n\nVui lòng đổi mật khẩu sau khi đăng nhập lần đầu.\n\nTrân trọng,\nAdmin`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Chào mừng bạn!</h1>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">Xin chào <strong>${username}</strong>,</p>
                <p style="color: #555;">Tài khoản của bạn đã được tạo thành công trên hệ thống.</p>
                <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #666;">Thông tin đăng nhập:</p>
                  <p style="margin: 8px 0 0; font-size: 16px;"><strong>Username:</strong> ${username}</p>
                  <p style="margin: 8px 0 0; font-size: 16px;"><strong>Email:</strong> ${to}</p>
                  <p style="margin: 8px 0 0; font-size: 16px;"><strong>Mật khẩu:</strong> <code style="background: #e9ecef; padding: 2px 8px; border-radius: 3px; font-size: 15px;">${password}</code></p>
                </div>
                <p style="color: #e74c3c; font-size: 14px;">⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu tiên.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="font-size: 12px; color: #aaa; text-align: center;">Email này được gửi tự động, vui lòng không trả lời.</p>
              </div>
            </div>
            `,
        });
        console.log("Password email sent to:", to, "| messageId:", info.messageId);
    }
}