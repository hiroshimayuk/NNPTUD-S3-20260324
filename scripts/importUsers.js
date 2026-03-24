/**
 * Script: importUsers.js
 * Mô tả: Import users từ file CSV, tạo random password 16 ký tự,
 *        gán role 'user', lưu vào MongoDB, và gửi email thông báo password.
 *
 * Cách chạy: node scripts/importUsers.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const userModel = require('../schemas/users');
const roleModel = require('../schemas/roles');

// ──────────────────────────────────────────────
// CẤU HÌNH MAILTRAP – điền thông tin của bạn
// ──────────────────────────────────────────────
const MAILTRAP_USER = process.env.MAILTRAP_USER || '';
const MAILTRAP_PASS = process.env.MAILTRAP_PASS || '';

const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASS,
    },
});

// ──────────────────────────────────────────────
// HÀM TẠO PASSWORD NGẪU NHIÊN 16 KÝ TỰ
// ──────────────────────────────────────────────
function generatePassword(length = 16) {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }
    return password;
}

// ──────────────────────────────────────────────
// HÀM GỬI EMAIL THÔNG BÁO PASSWORD
// ──────────────────────────────────────────────
async function sendPasswordEmail(to, username, password) {
    const info = await transporter.sendMail({
        from: '"Admin NNPTUD" <admin@haha.com>',
        to: to,
        subject: '🎉 Tài khoản của bạn đã được tạo',
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
    console.log(`  ✉️  Email gửi tới ${to} – messageId: ${info.messageId}`);
}

// ──────────────────────────────────────────────
// HÀM ĐỌC FILE CSV
// ──────────────────────────────────────────────
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const obj = {};
        headers.forEach((h, i) => (obj[h] = values[i]));
        return obj;
    });
}

// ──────────────────────────────────────────────
// HÀM CHÍNH
// ──────────────────────────────────────────────
async function importUsers() {
    // 1. Kết nối MongoDB
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-S3');
    console.log('✅ Đã kết nối MongoDB\n');

    // 2. Tìm role 'user'
    let userRole = await roleModel.findOne({ name: 'user' });
    if (!userRole) {
        userRole = await roleModel.create({ name: 'user', description: 'Regular user' });
        console.log('📝 Đã tạo role "user"\n');
    }

    // 3. Đọc file CSV
    const csvPath = path.join(__dirname, '../data/users.csv');
    const users = parseCSV(csvPath);
    console.log(`📄 Đọc được ${users.length} users từ CSV\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 4. Lặp qua từng user
    for (const row of users) {
        const { username, email } = row;
        try {
            // Kiểm tra đã tồn tại chưa
            const existing = await userModel.findOne({
                $or: [{ username }, { email }],
            });
            if (existing) {
                console.log(`⏭️  Bỏ qua ${username} (${email}) – đã tồn tại`);
                skipCount++;
                continue;
            }

            // Tạo password ngẫu nhiên
            const rawPassword = generatePassword(16);

            // Tạo user (schema sẽ tự hash password qua pre-save hook)
            const newUser = new userModel({
                username,
                email,
                password: rawPassword,
                role: userRole._id,
                status: true,
            });
            await newUser.save();

            console.log(`✅ Tạo user: ${username} (${email}) | password: ${rawPassword}`);

            // Gửi email password (dùng rawPassword trước khi hash)
            await sendPasswordEmail(email, username, rawPassword);

            successCount++;
        } catch (err) {
            console.error(`❌ Lỗi khi tạo ${username}: ${err.message}`);
            errorCount++;
        }
    }

    // 5. Tổng kết
    console.log('\n══════════════════════════════');
    console.log(`📊 KẾT QUẢ IMPORT:`);
    console.log(`   ✅ Thành công : ${successCount}`);
    console.log(`   ⏭️  Bỏ qua    : ${skipCount}`);
    console.log(`   ❌ Lỗi       : ${errorCount}`);
    console.log('══════════════════════════════\n');

    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
}

importUsers().catch((err) => {
    console.error('Lỗi nghiêm trọng:', err);
    process.exit(1);
});
