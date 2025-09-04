const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { request, gql } = require('graphql-request');
const router = express.Router();

require('dotenv').config();

const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// 发送重置密码邮件
router.post('/user/change-password/request', async (req, res) => {
  const { username } = req.body;

  if (!username || !username.includes('@')) {
    return res.status(400).json({ error: '请输入有效的邮箱地址' });
  }

  try {
    const query = gql`
      query GetUserByUsername($username: String!) {
        user(where: { username: { _eq: $username } }) {
          uuid
        }
      }
    `;

    const data = await request(HASURA_ENDPOINT, query, { username }, {
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    });

    if (!data.user || data.user.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = data.user[0];
    const token = jwt.sign({ uuid: user.uuid }, JWT_SECRET, { expiresIn: '15m' });

    const resetLink = `http://your-frontend-url/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: username,
      subject: '密码重置请求',
      html: `<p>请点击以下链接重置您的密码：</p><a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: '重置链接已发送至您的邮箱' });
  } catch (error) {
    console.error('发送重置邮件失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 验证 token 并更新密码
router.post('/user/change-password/action', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userUuid = decoded.uuid;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const mutation = gql`
      mutation UpdateUserPassword($uuid: uuid!, $password: String!) {
        update_user_by_pk(pk_columns: { uuid: $uuid }, _set: { password: $password }) {
          uuid
        }
      }
    `;

    await request(HASURA_ENDPOINT, mutation, {
      uuid: userUuid,
      password: hashedPassword,
    }, {
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    });

    res.status(200).json({ message: '密码已成功更新' });
  } catch (error) {
    console.error('密码更新失败:', error);
    res.status(401).json({ error: '无效或过期的 token' });
  }
});

module.exports = router;
