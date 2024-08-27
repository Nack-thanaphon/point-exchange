"use client";

import { lineLogin } from "@/service/line.service";
import { faPhone, faTicket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import * as dotenv from "dotenv";
import { getStatusClass } from "@/util/common";

dotenv.config();

export default function Home() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalRef2 = useRef<HTMLDialogElement>(null);
  const modalRef3 = useRef<HTMLDialogElement>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userdata, setUserdata] = useState({
    clientId: "",
    displayName: "",
    pictureUrl: "",
  });
  const [pointData, setPointData] = useState(0);
  const [listData, setListData] = useState([
    {
      status: "",
      point: 0,
      created_at: "",
    },
  ]);

  const [money, setMoney] = useState(0);
  const [point, setPoint] = useState(0);
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("");

  const reloadData = async (clientId: string) => {
    await getPoint(clientId);
    await axios
      .get(process.env.NEXT_PUBLIC_BACKEND_URL + "/exchange-list/" + clientId)
      .then((response) => {
        setListData(response.data);
      });
  };

  const getPoint = (clientId: string) => {
    axios
      .get(process.env.NEXT_PUBLIC_BACKEND_URL + "/get-point/" + clientId)
      .then((response) => {
        setPointData(response.data.points);
      });
  };

  useEffect(() => {
    const initialize = async () => {
      const lineData = await lineLogin();
      console.log("lineLogin data", lineData);
      setUserdata({
        clientId: lineData.clientId,
        displayName: lineData.displayName,
        pictureUrl: lineData.pictureUrl,
      });
      setLoading(false);

      const newSocket = io("https://services.contactus.work", {
        path: "/api/line/socket.io",
        transports: ["websocket", "polling"],
      });

      reloadData(lineData.clientId);
      newSocket.on("connect", () => {
        console.log("Connected to server with ID:", newSocket.id);
      });

      newSocket.on("my-qrcode", (data) => {
        console.log("QR Code generated event received:", data);
        let clientId = data.clientId;
        if (clientId === lineData.clientId) {
          setQrCodeData(data.qrCode);
          openModal2();
        } else {
          console.error("Client ID mismatch:", clientId, userdata.clientId);
        }
      });

      newSocket.on("exchange-result", (result) => {
        console.log("Exchange result event received:", result);
        if (result?.exchangeId && result.success) {
          closeModal();
          reloadData(lineData.clientId);
          getPoint(lineData.clientId);
          openModal3("Exchange successful!", "success");
          if (modalRef2.current) {
            modalRef2.current.close();
          }
        } else {
          openModal3("Exchange failed. Please try again.", "fail");
          if (modalRef2.current) {
            modalRef2.current.close();
          }
        }
      });
    };

    initialize();
  }, []);

  const openModal = () => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  const closeModal = () => {
    if (modalRef.current && modalRef.current.open) {
      modalRef.current.close();
    }
    if (modalRef2.current && modalRef2.current.open) {
      modalRef2.current.close();
    }
  };

  const openModal2 = () => {
    closeModal();
    if (modalRef2.current) {
      modalRef2.current.showModal();
    }
  };

  const openModal3 = (message: string, status: string) => {
    closeModal();
    if (modalRef3.current) {
      setMessageStatus(status);
      setMessage(message);
      modalRef3.current.showModal();
    }
    setTimeout(() => {
      if (modalRef3.current && modalRef3.current.open) {
        modalRef3.current.close();
      }
    }, 5000); // Hide after 3 seconds
  };

  const exchangePoints = async (points: number) => {
    try {
      setMoney(points / 10);
      setPoint(points);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/exchange`,
        {
          clientId: userdata.clientId,
          points,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Exchange successful:", response.data);
        openModal2();
      } else {
        console.log("Network response was not ok");
      }
    } catch (error) {
      console.error("Error during exchange:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-auto h-screen">
        <span className="loading loading-dots loading-xs"></span>
      </div>
    );
  }

  return (
    <div className="sm:p-[30px] p-[15px]  container mx-auto">
      <div className="mb-[20px]">
        <div className="sm:flex  justify-between mb-4">
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-black">ระบบแลกแต้ม</h1>
            <p>สะสมคะแนนเพื่อใช้เป็นส่วนลด</p>
          </div>
          <div className="flex shadow-md bg-white text-[#196468] px-4 py-3 my-auto rounded-[10px] font-bold  mb-2">
            <div className="avatar mr-3">
              <div className=" w-[50px] rounded-full">
                <img src={userdata.pictureUrl} alt="avatar" />
              </div>
            </div>
            <div className="my-auto">
              <p className="m-0 p-0 font-bold capitalize">
                {userdata.displayName}
              </p>
              <small>
                <FontAwesomeIcon icon={faPhone} /> 0636749204
              </small>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-1">
          <div className="text-start shadow-md bg-[#196468] text-white px-4 py-[30px] rounded-[10px] font-bold  mb-3 ">
            <p className="m-0 p-0 font-bold capitalize">
              แต้มที่สามารถใช้งานได้
            </p>
            <p className="text-[3rem]">{pointData} คะแนน</p>
          </div>
        </div>
        <div className="">
          <div
            onClick={() => openModal()}
            className="flex justify-between shadow-md bg-[#196468] text-white px-4 py-[30px] rounded-[10px] font-bold  mb-3 "
          >
            <p className="m-0 p-0 text-[2rem] font-bold capitalize ">
              กดแลกคะแนน
            </p>
            {/* <FontAwesomeIcon
              className="text-[5rem] text-slate-30"
              icon={faTicket}
            /> */}
          </div>
        </div>
      </div>

      <div className="flex justify-between my-[20px]">
        <div className="my-auto">
          <p className="p-0 m-0"> ประวัติการแลกแต้ม </p>
        </div>
        <Link href="/" className="text-[#196468] font-bold hover:underline ">
          กลับ
        </Link>
      </div>
      <div className="grid  grid-cols-1 gap-4 my-5">
        {/* Example of transaction history */}
        {listData.map((item, index) => {
          return (
            <div
              key={index}
              className="bg-white rounded-[10px] p-3 py-5 shadow-md border-l-[10px] border-[#196468]"
            >
              <div>
                สถานะ:{" "}
                <span className={`font-bold ${getStatusClass(item.status)}`}>
                  {item.status}
                </span>{" "}
              </div>
              <p>คะแนนที่แลก: {item.point}</p>
              <p>เวลา: {item.created_at}</p>
            </div>
          );
        })}

        {/* Add more transaction history items here */}
      </div>

      {/* Modal for selecting points */}
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">จำนวนคะแนน</h3>
          <div className="py-4">
            คะแนนที่ต้องการแลก:
            <div className="grid grid-cols-2 my-2 gap-2">
              <div
                onClick={() => pointData >= 20 && exchangePoints(20)}
                className={`border rounded-[10px] p-2 font-bold text-center ${
                  pointData < 20
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-white cursor-pointer"
                }`}
              >
                20
              </div>
              <div
                onClick={() => pointData >= 500 && exchangePoints(500)}
                className={`border rounded-[10px] p-2 font-bold text-center ${
                  pointData < 500
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-white-200 cursor-pointer"
                }`}
              >
                500
              </div>
              <div
                onClick={() => pointData >= 700 && exchangePoints(700)}
                className={`border rounded-[10px] p-2 font-bold text-center ${
                  pointData < 700
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-white-200 cursor-pointer"
                }`}
              >
                700
              </div>
              <div
                onClick={() => pointData >= 1000 && exchangePoints(1000)}
                className={`border rounded-[10px] p-2 font-bold text-center ${
                  pointData < 1000
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-white-200 cursor-pointer"
                }`}
              >
                1000
              </div>
            </div>
          </div>
          <small>ใช้แทนเงินสดได้ : {money} บาท</small>
          <div className="modal-action">
            <button onClick={closeModal} className="btn">
              ปิด
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal for displaying QR Code */}
      <dialog id="my_modal_2" className="modal" ref={modalRef2}>
        <div className="modal-box">
          <h3 className="font-bold text-[2rem] text-center">
            โปรดยื่นให้พนักงาน
          </h3>
          <div className="py-4 flex justify-center">
            {qrCodeData ? (
              <img src={qrCodeData} className="w-[250px]" alt="QR Code" />
            ) : (
              <p>กำลังสร้าง QR Code...</p>
            )}
          </div>
          <div className="mx-auto text-center">
            <h3 className="text-[2rem] font-bold">จำนวน {point} คะแนน</h3>
            <p>ส่วนลดแทนเงินสด {money} บาท</p>
            {/* <small>เหลือเวลา 5 นาที</small> */}
          </div>
          <div className="modal-action">
            <button onClick={closeModal} className="btn">
              ยกเลิก
            </button>
          </div>
        </div>
      </dialog>

      <dialog className="modal" ref={modalRef3}>
        <div className="modal-box">
          <h3 className="font-bold text-[2rem] text-center">{message}</h3>
          <div className="py-4 flex justify-center">
            {messageStatus === "success" ? (
              <img
                src="https://clipart-library.com/images_k/success-transparent/success-transparent-3.png"
                className="w-[250px]"
                alt="QR Code"
              />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/512/4944/4944966.png"
                className="w-[250px]"
                alt="QR Code"
              />
            )}
          </div>

          <div className="modal-action">
            <button onClick={closeModal} className="btn">
              ยกเลิก
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
