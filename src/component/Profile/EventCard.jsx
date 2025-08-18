import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";
import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";

export const EventCard = () => {
  return (
    <div>
      <Card sx={{ width: 345 }}>
        <CardMedia
          sx={{ height: 345 }}
          image="https://cdn.pixabay.com/photo/2020/12/17/00/50/food-5838035_1280.jpg"
        />
        <CardContent>
          <Typography variant="h5">Indian Mandi food</Typography>
          <Typography variant="body2">69% off on all items</Typography>
          <div className="py-2 space-y-2">
            <p>{"Vijayawada"}</p>
            <p className="text-sm text-blue-500">July 25,2025 6:00 PM</p>
            <p className="text-sm text-blue-500">July 26,2025 8:00 PM</p>
          </div>
        </CardContent>
       {true && <CardActions>
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </CardActions>}
      </Card>
    </div>
  );
};
