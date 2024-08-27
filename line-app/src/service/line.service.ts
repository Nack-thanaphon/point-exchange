import axios from "axios";
import liff from "@line/liff";
import * as dotenv from "dotenv";

dotenv.config();
let LiffID = "2006147509-gDlqxEnB";

let channelToken = "pWqFwpY+tRl3iWvE23+o0cepAVBn/FiIMmsvuSKnJYMUujvdrCboe5/frjph7zSI8uWpCaTv9Yl24UBtSlVJPfsUHhGJlnaNL8qz25UR46BOjE3juEHYsY0G7DF1RQqbnegMGE3RE8cCKb+ajdxgHwdB04t89/1O/w1cDnyilFU=";

const fetchUserProfile = async (): Promise<{ clientId: string, displayName: string, pictureUrl: string,  }> => {
    const userId = localStorage.getItem("userId");
    if (userId !== null) {
        return {
            clientId: userId,
            displayName: localStorage.getItem("displayName") || "",
            pictureUrl: localStorage.getItem("pictureUrl") || "",
        };
    } else {
        const profile = await liff.getProfile();
        const data = {
            clientId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl || "", // Ensure pictureUrl is always a string
            points: 0 // Default points value
        };

        localStorage.setItem("userId", profile.userId);
        localStorage.setItem("displayName", profile.displayName);
        localStorage.setItem("pictureUrl", profile.pictureUrl || ""); // Ensure pictureUrl is always a string
        localStorage.setItem("points", "0"); // Default points value

        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/create-user`;

        try {
            const response = await axios.post(url, data);

            const profileData = response.data;
            localStorage.setItem("clientId", profileData.clientId);
            localStorage.setItem("displayName", profileData.displayName);
            localStorage.setItem("pictureUrl", profileData.pictureUrl || "");
            localStorage.setItem("points", profileData.points);

            return {
                clientId: profileData.clientId,
                displayName: profileData.displayName,
                pictureUrl: profileData.pictureUrl,
            };

        } catch (error) {
            console.log('error ===>', error);
            return {
                clientId: '',
                displayName: '',
                pictureUrl: '',
            };
        }
    }
};

export const lineLogin = (): Promise<{ clientId: string, displayName: string, pictureUrl: string }> => {
    return liff.init({
        liffId: LiffID,
        withLoginOnExternalBrowser: true
    }).then(() => {
        return liff.ready.then(async () => {
            if (liff.isInClient() || liff.isLoggedIn()) {
                return await fetchUserProfile();
            }
            throw new Error("Not logged in");
        });
    });
};

export const getTotalSend = async () => {
    try {
        const response = await axios.get(
            "https://services.contactus.work/api/line/getTotalSend",
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${channelToken}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
};

export const getFriendship = async () => {
    const friend = await liff.getFriendship();
    return friend.friendFlag;
};

export const logout = () => {
    liff.logout();
    window.location.reload();
};