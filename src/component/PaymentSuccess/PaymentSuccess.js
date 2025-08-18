import React from 'react'
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Button, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const PaymentSuccess = () => {
    const navigate = useNavigate();
  return (
    <div className='min-h-screen px-5'>
        <div className='flex flex-col items-center justify-center h-[90vh]'>
            <Card className='box w-full lg:w-1/4 flex flex-col items-center rounded-md p-5'>
                <TaskAltIcon className='text-green-500' sx={{ fontSize: 100 }} />
                <h2 className='text-lg font-semibold'>Payment Successful</h2>
                <p className='text-center py-3 text-gray-400'>Thank you for your order!</p>
                <p className='text-center py-3 text-gray-400'>Your order has been placed successfully.</p>
                <Button onClick={() => navigate("/")} variant="contained" className='py-5' sx={{margin:"1rem 0rem"}}>Go To Home</Button>
            </Card>
        </div>
        
    </div>
  )
}
