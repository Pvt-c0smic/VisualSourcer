import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface CertificateOptions {
  template: string;
  recipientName: string;
  programName: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string | null;
  outputPath: string;
}

export async function generateCertificate(options: CertificateOptions): Promise<string> {
  const {
    template,
    recipientName,
    programName,
    certificateNumber,
    issueDate,
    expiryDate,
    outputPath
  } = options;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Format dates to be more human-readable
  const formattedIssueDate = new Date(issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedExpiryDate = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'No Expiration';

  // Replace placeholders in the template
  let htmlContent = template
    .replace(/\${recipientName}/g, recipientName)
    .replace(/\${programName}/g, programName)
    .replace(/\${certificateNumber}/g, certificateNumber)
    .replace(/\${issueDate}/g, formattedIssueDate)
    .replace(/\${expiryDate}/g, formattedExpiryDate);

  // Launch puppeteer
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true // Use headless mode
  });

  try {
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Set PDF options for a certificate-style output (landscape, high quality)
    await page.pdf({
      path: outputPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.5cm',
        right: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm'
      }
    });
    
    return outputPath;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Default certificate template HTML
export const defaultCertificateTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      text-align: center;
      background-color: #f9f9f9;
      padding: 20px;
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .certificate {
      background-color: white;
      border: 20px solid #073763;
      padding: 40px;
      margin: auto;
      max-width: 800px;
      box-shadow: 0 0 25px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    
    .certificate:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2px solid #d4af37;
      margin: 10px;
      pointer-events: none;
    }
    
    .header {
      margin-bottom: 20px;
    }
    
    .title {
      font-size: 36px;
      font-weight: bold;
      color: #073763;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 30px;
    }
    
    .content {
      margin-bottom: 30px;
    }
    
    .recipient {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      margin: 20px 0;
      border-bottom: 2px solid #d4af37;
      display: inline-block;
      padding: 0 20px 5px;
    }
    
    .program {
      font-size: 22px;
      color: #073763;
      margin: 20px 0;
      font-style: italic;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    
    .date, .number {
      font-size: 14px;
      color: #666;
    }
    
    .seal {
      width: 100px;
      height: 100px;
      background-color: #d4af37;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
      transform: rotate(-15deg);
    }
    
    .signature {
      margin-top: 30px;
    }
    
    .signature-line {
      width: 200px;
      border-top: 1px solid #333;
      margin: 10px auto;
    }
    
    .signature-name {
      font-size: 16px;
      font-weight: bold;
    }
    
    .signature-title {
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="title">Certificate of Completion</div>
      <div class="subtitle">This certifies that</div>
    </div>
    
    <div class="content">
      <div class="recipient">\${recipientName}</div>
      <div class="description">has successfully completed the</div>
      <div class="program">\${programName}</div>
    </div>
    
    <div class="seal">OFFICIAL</div>
    
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">Training Authority</div>
      <div class="signature-title">Network Battalion</div>
    </div>
    
    <div class="footer">
      <div class="date">Issue Date: \${issueDate}</div>
      <div class="expiry">Expiry Date: \${expiryDate}</div>
      <div class="number">Certificate #: \${certificateNumber}</div>
    </div>
  </div>
</body>
</html>
`;