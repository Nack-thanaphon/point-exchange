import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useEffect, useState } from "react";
import axios from "axios";
import { getTotalSend, lineLogin } from "@/service/line.service";
import Link from "next/link";
import {
  faBarcode,
  faPhone,
  faQrcode,
  faServer,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate, getStatusClass } from "@/util/common";

export default function Home() {
  const [totalSend, setTotalSend] = useState(0);
  const [totalLimit, setTotalLimit] = useState(0);
  const [loading, setLoading] = useState(true);
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
    const fetchData = async () => {
      try {
        const { limit, total } = await getTotalSend();
        setTotalSend(total);
        setTotalLimit(limit);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    init();
    reloadData();
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center my-auto h-screen">
        <span className="loading loading-dots loading-xs"></span>
      </div>
    );
  }

  return (
    <div className="sm:p-[30px] p-[15px] sm:h-screen container mx-auto">
      <div className="sm:flex justify-between mb-[20px]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-black">Dashboard</h1>
          <p>Point-Exchange</p>
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
      <div className="sm:flex justify-between mb-[20px]">
        <div className="sm:flex justify-between">
          <div className="shadow-md bg-[#196468] text-white px-4 py-3 rounded-[10px] font-bold  mb-2 sm:mr-3 sm:w-[250px]">
            <p className="m-0 p-0 font-bold capitalize text-[10px]">
              <FontAwesomeIcon icon={faServer} /> สถานะการใช้งาน
            </p>
            <p className="text-[20px]">ยอดเยี่ยม</p>
          </div>
          <div className="shadow-md bg-[#196468] text-white px-4 py-3 rounded-[10px] font-bold  mb-2 sm:mr-3 sm:w-[250px]">
            <Link href={"/client"}>
              <p className="m-0 p-0 font-bold capitalize text-[10px]">
                <FontAwesomeIcon icon={faQrcode} /> หน้าจัดการ
              </p>
              <p className="text-[20px]">ผู้ใช้งาน</p>
            </Link>
          </div>
          <div className="shadow-md bg-[#196468] text-white px-4 py-3 rounded-[10px] font-bold  mb-2 sm:mr-3 sm:w-[250px]">
            <Link href={"/admin"}>
              <p className="m-0 p-0 font-bold capitalize text-[10px]">
                <FontAwesomeIcon icon={faBarcode} /> หน้าจัดการ
              </p>
              <p className="text-[20px]">แคลชเชียร์</p>
            </Link>
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 grid-cols-1 gap-4 ">
        <div className="bg-white p-3 shadow-md rounded-[10px] ">
          <p>ปริมาณการส่งทั้งหมด</p>
          <div>
            <h1 className="text-black text-[3rem] font-bold">
              {totalSend ?? 0}
            </h1>
          </div>
        </div>
        <div className="bg-white p-3 shadow-md rounded-[10px] ">
          <p>จำนวนการใช้งาน</p>
          <div className="flex align-bottom ">
            <h1 className="text-black text-[3rem] font-bold">
              {totalSend}
              <span className="text-slate-300 text-[1rem]">
                /{totalLimit}
              </span>{" "}
            </h1>
          </div>
        </div>
        <div className="bg-white p-3 shadow-md rounded-[10px] ">
          <p>จำนวนข้อผิดพลาด</p>
          <div>
            <h1 className="text-black text-[3rem] font-bold">0</h1>
          </div>
        </div>
      </div>
      <div className="flex justify-between my-[20px]">
        {/* <div className="my-auto ">
          <p className=" p-0 m-0"> ประวัติการใช้งาน </p>
        </div> */}
        {/* <Link
          href="/point"
          className="text-[#196468] font-bold hover:underline "
        >
          ดูทั้งหมด
        </Link> */}
      </div>
      <div className="grid  sm:grid-cols-3 grid-cols-1 gap-4 my-5">
        {/* Example of transaction history */}
        {/* {listData.map((item, index) => {
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
        })} */}

        {/* Add more transaction history items here */}
      </div>
    </div>
  );
}
