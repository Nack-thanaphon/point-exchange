import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const LineNotiTemplate = (userId, point) => {
    const redirectURL = 'https://point-ex.vercel.app/client';
    return {
        to: userId,
        messages: [
            {
                type: 'flex',
                altText: 'คะแนนของฉัน',
                contents: {
                    "type": "bubble",
                    "direction": "ltr",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "คุณมีคะแนน",
                                "weight": "regular",
                                "size": "xl",
                                "align": "center",
                                "gravity": "top",
                                "contents": []
                            },
                            {
                                "type": "text",
                                "text": String(point), // Ensure point is a string
                                "weight": "bold",
                                "size": "4xl",
                                "align": "center",
                                "gravity": "center",
                                "margin": "xxl",
                                "contents": []
                            }
                        ]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "แลกคะแนน",
                                    "uri": redirectURL
                                },
                                "color": "#1FBA7FFF",
                                "style": "primary"
                            }
                        ]
                    }
                },
            },
        ],
    };
};

const LineNotiTemplatev1 = (userId, point, total) => {
    const redirectURL = 'https://point-ex.vercel.app/client';
    return {
        to: userId,
        messages: [
            {
                type: 'flex',
                altText: 'คะแนนของฉัน',
                contents: {
                    "type": "bubble",
                    "direction": "ltr",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "แลกคะแนนสำเร็จ",
                                "weight": "regular",
                                "size": "xl",
                                "align": "center",
                                "gravity": "top",
                                "contents": []
                            },
                            {
                                "type": "text",
                                "text": String(point), // Ensure point is a string
                                "weight": "bold",
                                "size": "4xl",
                                "align": "center",
                                "gravity": "top",
                                "margin": "xl",
                                "contents": []
                            },
                            {
                                "type": "text",
                                "text": "คงเหลือ " + String(total) + " คะแนน", // Ensure total is a string
                                "weight": "bold",
                                "size": "xxs",
                                "color": "#B9B9B9FF",
                                "align": "center",
                                "gravity": "top",
                                "margin": "xs",
                                "contents": []
                            }
                        ]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "แลกคะแนน",
                                    "uri": redirectURL
                                },
                                "color": "#1FBA7FFF",
                                "style": "primary"
                            }
                        ]
                    }
                }
            },
        ],
    };
};

export const checkPoint = async (userId, point) => {
    const linePushMessage = 'https://api.line.me/v2/bot/message/push';
    const lineChanelToken = process.env.LINE_CHANNEL_TOKEN;

    if (!lineChanelToken) {
        throw new Error('LINE_CHANNEL_TOKEN is not defined in environment variables');
    }

    const data = LineNotiTemplate(userId, point);

    try {
        const response = await axios.post(linePushMessage, data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${lineChanelToken}`,
            },
        });
        return response;
    } catch (error) {
        console.error(`Error in sendLine: ${error.message}`);
        throw error;
    }
};

export const successPoint = async (userId, point, total) => {
    const linePushMessage = 'https://api.line.me/v2/bot/message/push';
    const lineChanelToken = process.env.LINE_CHANNEL_TOKEN;

    if (!lineChanelToken) {
        throw new Error('LINE_CHANNEL_TOKEN is not defined in environment variables');
    }

    const data = LineNotiTemplatev1(userId, point, total);

    try {
        const response = await axios.post(linePushMessage, data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${lineChanelToken}`,
            },
        });
        return response;
    } catch (error) {
        console.error(`Error in sendLine: ${error.message}`);
        throw error;
    }
};