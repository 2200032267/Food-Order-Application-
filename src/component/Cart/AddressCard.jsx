import React from "react";

import HomeIcon from "@mui/icons-material/Home";
import { Button, Card } from "@mui/material";

export const AddressCard = ({ item, showButton ,handleselectAddress}) => {

  return (
    <Card className="flex gap-5 w-64 p-5">
      <HomeIcon />
      <div className="space-y-3 text-gray-500">
        <h1 className="font-semibold text-lg text-white">Home</h1>
        <p>123 Main Street, City, State, 12345</p>
        {showButton && (<Button  variant="outlined" fullWidth onClick={() => handleselectAddress(item)}>select</Button>)}
      </div>
    </Card>
  );
};
