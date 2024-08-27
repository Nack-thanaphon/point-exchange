import React from "react";

function ListUser({ data }: any) {
  // console.log(data);'
  if (!data) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="mt-4">
      <div className="flex overflow-x-scroll my-4">
        {data.map((item: any, i: number) => {
          return (
            <div key={i} className="flex-shrink-0 w-24 mr-5">
              <img
                src={item.pictureUrl}
                className="rounded-full w-[100px] h-[100px] fit-cover m-4"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ListUser;
