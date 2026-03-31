const generatePartnerWelcomeEmail = (partnerName, partnerTier, accessCode) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Lifetime Access Code - CloudLiteracy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3); border: 2px solid #FFD700;">
                    
                    <!-- Header with Gold Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                🌟 CloudLiteracy 🌟
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px; font-weight: 600;">
                                Empowering Human Advancement Through Education
                            </p>
                        </td>
                    </tr>

                    <!-- Welcome Message -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h2 style="margin: 0 0 20px 0; color: #FFD700; font-size: 28px; font-weight: bold;">
                                Welcome, ${partnerName}! 🎉
                            </h2>
                            <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px; line-height: 1.6;">
                                Thank you for your <strong style="color: #FFD700;">incredible love</strong> and unwavering commitment to <strong style="color: #FFD700;">human advancement</strong>.
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                                Your partnership as a <strong style="color: #FFD700;">${partnerTier} Partner</strong> is transforming lives and shaping the future of technology education across the globe.
                            </p>
                        </td>
                    </tr>

                    <!-- Tier Badge -->
                    <tr>
                        <td align="center" style="padding: 0 30px 30px 30px;">
                            <div style="display: inline-block; background: ${
                              partnerTier === 'Diamond' ? 'linear-gradient(135deg, #b9f2ff 0%, #00d4ff 100%)' :
                              partnerTier === 'Platinum' ? 'linear-gradient(135deg, #E5E4E2 0%, #C0C0C0 100%)' :
                              partnerTier === 'Gold' ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
                              'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)'
                            }; padding: 15px 40px; border-radius: 50px; box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);">
                                <span style="color: #000000; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                    ${partnerTier === 'Diamond' ? '💎' : partnerTier === 'Platinum' ? '🏆' : partnerTier === 'Gold' ? '🥇' : '🥈'} ${partnerTier} Partner
                                </span>
                            </div>
                        </td>
                    </tr>

                    <!-- Access Code Section -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border: 3px solid #FFD700; border-radius: 15px; padding: 30px; box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.2);">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 15px 0; color: #FFD700; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                            🔑 Your Lifetime Access Code
                                        </p>
                                        <div style="background-color: #FFD700; padding: 20px 30px; border-radius: 10px; margin: 0 0 15px 0;">
                                            <p style="margin: 0; color: #000000; font-size: 36px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                                                ${accessCode}
                                            </p>
                                        </div>
                                        <p style="margin: 0; color: #cccccc; font-size: 14px; line-height: 1.5;">
                                            This code grants you <strong style="color: #FFD700;">unlimited lifetime access</strong> to all CloudLiteracy modules, resources, and future content updates.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Benefits Section -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <h3 style="margin: 0 0 20px 0; color: #FFD700; font-size: 22px; font-weight: bold; text-align: center;">
                                Your Partnership Benefits
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Unlimited access to all Pre-DevOps modules
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Priority access to new courses and content
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Exclusive partner recognition and certificates
                                        </p>
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="padding: 15px; background-color: #0d0d0d; border-left: 4px solid #FFD700; margin-bottom: 10px; border-radius: 8px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 15px;">
                                            <strong style="color: #FFD700;">✓</strong> Direct impact on global tech education initiatives
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Gratitude Message -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%); border: 2px solid #FFD700; border-radius: 15px; padding: 30px;">
                                <p style="margin: 0 0 15px 0; color: #FFD700; font-size: 20px; font-weight: bold;">
                                    💛 A Heartfelt Thank You
                                </p>
                                <p style="margin: 0; color: #ffffff; font-size: 16px; line-height: 1.8;">
                                    Your investment goes beyond education—it's a <strong style="color: #FFD700;">catalyst for change</strong>. 
                                    Together, we're breaking barriers, creating opportunities, and empowering the next generation 
                                    of tech innovators. Your belief in human potential is <strong style="color: #FFD700;">transforming lives</strong>.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Call to Action -->
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px;">
                            <a href="http://localhost:3000/modules" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4); transition: all 0.3s;">
                                🚀 Start Learning Now
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center; border-top: 2px solid #FFD700;">
                            <p style="margin: 0 0 10px 0; color: #FFD700; font-size: 18px; font-weight: bold;">
                                CloudLiteracy
                            </p>
                            <p style="margin: 0 0 15px 0; color: #999999; font-size: 14px;">
                                Empowering the Future, One Learner at a Time
                            </p>
                            <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px;">
                                📧 support@cloudliteracy.com | 🌐 www.cloudliteracy.com
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

module.exports = { generatePartnerWelcomeEmail };
