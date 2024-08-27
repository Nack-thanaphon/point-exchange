import { faPhone, faQrcode, faTicket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { formatDate, getStatusClass } from "@/util/common";
import axios from "axios";
import { lineLogin } from "@/service/line.service";

export default function Admin() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputDataRef = useRef<HTMLSpanElement | null>(null);
  const loadingMessageRef = useRef<HTMLDivElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const beepSoundRef = useRef<HTMLAudioElement | null>(null);
  const [exchangeId, setExchangeId] = useState("");
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const modalRef = useRef<HTMLDialogElement>(null);
  const [listData, setListData] = useState([
    {
      status: "",
      point: 0,
      created_at: "",
    },
  ]);
  const [userdata, setUserdata] = useState({
    clientId: "",
    displayName: "",
    pictureUrl: "",
  });

  const reloadData = async () => {
    await axios
      .get(process.env.NEXT_PUBLIC_BACKEND_URL + "/exchange-list")
      .then((response) => {
        setListData(response.data);
      });
  };
  const init = async () => {
    const lineData = await lineLogin();
    console.log("lineLogin data", lineData);
    setUserdata({
      clientId: lineData.clientId,
      displayName: lineData.displayName,
      pictureUrl: lineData.pictureUrl,
    });
  };

  useEffect(() => {
    init();
    reloadData();
    // Dynamically load the jsQR script
    const script = document.createElement("script");
    script.src = "jsQR.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log("jsQR loaded successfully.");
    };

    script.onerror = () => {
      console.error("Failed to load jsQR.");
    };

    const newSocket = io("https://services.contactus.work", {
      path: "/api/line/socket.io",
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server admin-id:", newSocket.id);
    });

    return () => {
      if (newSocket) newSocket.disconnect();
      document.body.removeChild(script);
    };
  }, []);

  const startScanner = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.hidden = false;
          videoRef.current.width = 500; // Set the width of the video element
          videoRef.current.height = 500; // Set the height of the video element
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
        alert("Error accessing camera: " + error.message);
      });
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return;

    if (loadingMessageRef.current) {
      loadingMessageRef.current.innerText = "⏳ Loading video...";
    }

    if (videoRef.current.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
      if (loadingMessageRef.current) loadingMessageRef.current.hidden = true;
      canvasRef.current.hidden = true;

      const canvas = canvasRef.current.getContext("2d");
      if (canvas) {
        canvasRef.current.height = 500;
        canvasRef.current.width = 500;
        canvas.drawImage(videoRef.current, 0, 0, 500, 500);

        if (!videoRef.current.paused) {
          const imageData = canvas.getImageData(0, 0, 500, 500);

          const jsQR = (window as any).jsQR;
          if (typeof jsQR !== "function") {
            console.error("jsQR is not available.");
            return;
          }

          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            drawLine(
              code.location.topLeftCorner,
              code.location.topRightCorner,
              "#FF3B58"
            );
            drawLine(
              code.location.topRightCorner,
              code.location.bottomRightCorner,
              "#FF3B58"
            );
            drawLine(
              code.location.bottomRightCorner,
              code.location.bottomLeftCorner,
              "#FF3B58"
            );
            drawLine(
              code.location.bottomLeftCorner,
              code.location.topLeftCorner,
              "#FF3B58"
            );

            if (outputDataRef.current) {
              outputDataRef.current.innerText = code.data;
              outputDataRef.current.parentElement!.hidden = false;
            }

            videoRef.current.pause();
            if (beepSoundRef.current) {
              beepSoundRef.current
                .play()
                .catch((err) => console.error("Error playing sound:", err));
            }
            const scanData: { exchangeId: string; points: number } = JSON.parse(
              code.data
            );
            setExchangeId(scanData.exchangeId);

            socket?.emit("scan-qr", {
              exchangeId: scanData.exchangeId,
              points: scanData.points,
            });

            console.log("Scanned data:", scanData);

            // Stop scanning after a successful scan
            return;
          } else {
            if (outputDataRef.current)
              outputDataRef.current.parentElement!.hidden = true;
          }
        }
      }
    }
    requestAnimationFrame(tick);
  };

  const drawLine = (
    begin: { x: number; y: number },
    end: { x: number; y: number },
    color: string
  ) => {
    const canvas = canvasRef.current?.getContext("2d");
    if (canvas) {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    }
  };

  const openModal = (message: string, status: string) => {
    if (modalRef.current) {
      setMessageStatus(status);
      setMessage(message);
      modalRef.current.showModal();
    }
    setTimeout(() => {
      reloadData();
      if (modalRef.current && modalRef.current.open) {
        modalRef.current.close();
      }
    }, 3000); // Hide after 3 seconds
  };

  useEffect(() => {
    if (socket && exchangeId !== "") {
      console.log("exchangeId ===>", exchangeId);
      socket.on("exchange-result", (result) => {
        if (exchangeId === result.exchangeId && result.success) {
          console.log("result ===>", result);
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          if (videoRef.current) videoRef.current.hidden = true;
          console.log(`Exchange successful for ID: ${result.exchangeId}`);
          setExchangeId("");
          openModal("Exchange successful.", "success");
        } else {
          openModal("Exchange failed or points insufficient.", "error");
          if (videoRef.current) videoRef.current.hidden = true;
          console.log("Exchange failed or points insufficient.");
          setExchangeId("");
        }
      });
    }
  }, [socket, exchangeId, stream]);

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

        <div className="mx-auto shadow-sm bg-white sm:w-[450px] my-[20px] p-4 rounded-[10px]">
          <div className="mx-auto" id="scanner">
            <div className="rounded-[10px] m-4 overflow-hidden">
              <video
                ref={videoRef}
                // style={{ width: "100% !important" }}
                hidden
              ></video>
              <canvas
                ref={canvasRef}
                // style={{ width: "100% !important" }}
                hidden
              ></canvas>
            </div>
            <button
              className=" bg-[#196468] text-white px-4 py-[20px] rounded-[10px] font-bold w-full"
              onClick={startScanner}
            >
              <FontAwesomeIcon icon={faQrcode} /> แสกน QR Code
            </button>
            <div id="output" hidden>
              <div id="outputMessage">No QR code detected.</div>
              <div className="mt-4">
                <b>เวลา :</b> <span ref={outputDataRef}></span>
              </div>
            </div>
            <audio ref={beepSoundRef} src="/beep.mp3"></audio>
          </div>
          <div className="mt-4 text-center" id="currentDate">
            เวลา : {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex justify-between my-[20px]">
        <div className="my-auto">
          {/* <p className="p-0 m-0"> ประวัติการแลกแต้ม </p> */}
        </div>
        <Link href="/" className="text-[#196468] font-bold hover:underline ">
          กลับ
        </Link>
      </div>
      <div className="grid  sm:grid-cols-2 grid-cols-1 gap-4 my-5">
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
              <b>คะแนน: {item.point}</b>
              <p>เวลา: {formatDate(item.created_at)}</p>
            </div>
          );
        })}

        {/* Add more transaction history items here */}
      </div>
      <dialog className="modal" ref={modalRef}>
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
        </div>
      </dialog>
    </div>
  );
}
