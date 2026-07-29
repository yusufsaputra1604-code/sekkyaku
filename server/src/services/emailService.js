const nodemailer = require('nodemailer');

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port == 465,
    auth: { user, pass },
  });
};

const sendReminderEmail = async (to, subject, html) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Email not configured - SMTP_USER and SMTP_PASS required');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Sekkyaku" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('Email error:', err.message);
    return false;
  }
};

const sendInvoiceReminder = async (client, invoice) => {
  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #9333ea;">Reminder Invoice</h2>
      <p>Halo ${client.name},</p>
      <p>Invoice <strong>${invoice.invoiceNo}</strong> akan jatuh tempo pada <strong>${new Date(invoice.dueDate).toLocaleDateString('id-ID')}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;">Invoice</td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${invoice.invoiceNo}</strong></td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;">Total</td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${formatCurrency(invoice.total)}</strong></td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;">Dibayar</td><td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(invoice.paidAmount)}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;">Sisa</td><td style="padding: 8px; border: 1px solid #ddd; color: #ef4444;"><strong>${formatCurrency(invoice.total - invoice.paidAmount)}</strong></td></tr>
      </table>
      <p>Mohon segera melakukan pembayaran sebelum tanggal jatuh tempo.</p>
      <p>Terima kasih,<br>Sekkyaku</p>
    </div>
  `;

  return sendReminderEmail(client.email, `Reminder: Invoice ${invoice.invoiceNo} Jatuh Tempo`, html);
};

const sendTaskReminder = async (user, task) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #9333ea;">Reminder Task</h2>
      <p>Halo ${user.name},</p>
      <p>Task <strong>"${task.title}"</strong> akan jatuh tempo pada <strong>${new Date(task.dueDate).toLocaleDateString('id-ID')}</strong>.</p>
      <p>Priority: <strong>${task.priority}</strong></p>
      <p>Status: <strong>${task.status}</strong></p>
      <p>Mohon segera diselesaikan sebelum deadline.</p>
      <p>Terima kasih,<br>Sekkyaku</p>
    </div>
  `;

  return sendReminderEmail(user.email, `Reminder: Task "${task.title}" Deadline`, html);
};

module.exports = { sendReminderEmail, sendInvoiceReminder, sendTaskReminder };
