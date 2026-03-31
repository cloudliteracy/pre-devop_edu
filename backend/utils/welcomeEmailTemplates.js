const generateAdminWelcomeEmail = (adminName, tempPassword, isSuperAdmin) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Admin - CloudLiteracy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3); border: 2px solid #FFD700;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                🌟 CloudLiteracy 🌟
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px; font-weight: 600;">
                                Admin Access Granted
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h2 style="margin: 0 0 20px 0; color: #FFD700; font-size: 28px; font-weight: bold;">
                                Welcome, ${adminName}! 🎉
                            </h2>
                            <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px; line-height: 1.6;">
                                You have been granted <strong style="color: #FFD700;">${isSuperAdmin ? 'Super Admin' : 'Admin'}</strong> access to CloudLiteracy.
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                                Your role is crucial in empowering learners and managing our educational platform.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border: 3px solid #FFD700; border-radius: 15px; padding: 30px; box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.2);">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 15px 0; color: #FFD700; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                            🔑 Your Temporary Password
                                        </p>
                                        <div style="background-color: #FFD700; padding: 20px 30px; border-radius: 10px; margin: 0 0 15px 0;">
                                            <p style="margin: 0; color: #000000; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                                                ${tempPassword}
                                            </p>
                                        </div>
                                        <p style="margin: 0; color: #ff9999; font-size: 14px; line-height: 1.5; background-color: #2d1a1a; padding: 15px; border-radius: 8px; border-left: 4px solid #ff4444;">
                                            ⚠️ <strong>Important:</strong> You must change this password on your first login for security.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px;">
                            <a href="http://localhost:3000/login" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);">
                                🚀 Login Now
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center; border-top: 2px solid #FFD700;">
                            <p style="margin: 0 0 10px 0; color: #FFD700; font-size: 18px; font-weight: bold;">
                                CloudLiteracy
                            </p>
                            <p style="margin: 0; color: #666666; font-size: 12px;">
                                © ${new Date().getFullYear()} CloudLiteracy. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

const generateUserWelcomeEmail = (userName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CloudLiteracy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3); border: 2px solid #FFD700;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                🌟 CloudLiteracy 🌟
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px; font-weight: 600;">
                                Your Journey to DevOps Excellence Begins
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h2 style="margin: 0 0 20px 0; color: #FFD700; font-size: 28px; font-weight: bold;">
                                Welcome, ${userName}! 🎉
                            </h2>
                            <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px; line-height: 1.6;">
                                Thank you for joining <strong style="color: #FFD700;">CloudLiteracy</strong> – your gateway to mastering Pre-DevOps skills.
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                                We're excited to be part of your learning journey and help you achieve your career goals in technology.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <h3 style="margin: 0 0 20px 0; color: #FFD700; font-size: 22px; font-weight: bold; text-align: center;">
                                What's Next?
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Explore 7 comprehensive Pre-DevOps modules
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Access video tutorials and PDF resources
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Test your knowledge with interactive quizzes
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Track your progress and earn certificates
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px;">
                            <a href="http://localhost:3000/modules" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);">
                                🚀 Start Learning
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center; border-top: 2px solid #FFD700;">
                            <p style="margin: 0 0 10px 0; color: #FFD700; font-size: 18px; font-weight: bold;">
                                CloudLiteracy
                            </p>
                            <p style="margin: 0 0 15px 0; color: #999999; font-size: 14px;">
                                Empowering the Future, One Learner at a Time
                            </p>
                            <p style="margin: 0; color: #666666; font-size: 12px;">
                                © ${new Date().getFullYear()} CloudLiteracy. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

const generateCSRWelcomeEmail = (userName, accessDuration) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSR Program Welcome - CloudLiteracy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3); border: 2px solid #FFD700;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                🌟 CloudLiteracy 🌟
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px; font-weight: 600;">
                                CSR Initiative - Free Access Granted
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h2 style="margin: 0 0 20px 0; color: #FFD700; font-size: 28px; font-weight: bold;">
                                Welcome, ${userName}! 🎉
                            </h2>
                            <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px; line-height: 1.6;">
                                You've been selected for our <strong style="color: #FFD700;">Corporate Social Responsibility</strong> program!
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                                Enjoy <strong style="color: #FFD700;">FREE access</strong> to all CloudLiteracy modules for <strong style="color: #FFD700;">${accessDuration} months</strong>.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%); border: 2px solid #FFD700; border-radius: 15px; padding: 30px; text-align: center;">
                                <p style="margin: 0 0 15px 0; color: #FFD700; font-size: 20px; font-weight: bold;">
                                    💛 Our Commitment to You
                                </p>
                                <p style="margin: 0; color: #ffffff; font-size: 16px; line-height: 1.8;">
                                    We believe education should be accessible to everyone. Through our CSR initiative, 
                                    we're investing in <strong style="color: #FFD700;">your future</strong> and the future of technology. 
                                    Your success is our mission.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <h3 style="margin: 0 0 20px 0; color: #FFD700; font-size: 22px; font-weight: bold; text-align: center;">
                                Your Free Benefits
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Full access to all 7 Pre-DevOps modules
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Unlimited video tutorials and PDF downloads
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Interactive quizzes and progress tracking
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Certificates upon module completion
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px;">
                            <a href="http://localhost:3000/modules" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);">
                                🚀 Start Learning Free
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center; border-top: 2px solid #FFD700;">
                            <p style="margin: 0 0 10px 0; color: #FFD700; font-size: 18px; font-weight: bold;">
                                CloudLiteracy
                            </p>
                            <p style="margin: 0 0 15px 0; color: #999999; font-size: 14px;">
                                Empowering Communities Through Education
                            </p>
                            <p style="margin: 0; color: #666666; font-size: 12px;">
                                © ${new Date().getFullYear()} CloudLiteracy. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

module.exports = { 
  generateAdminWelcomeEmail, 
  generateUserWelcomeEmail, 
  generateCSRWelcomeEmail 
};
