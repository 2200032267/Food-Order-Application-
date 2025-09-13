import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { EventCard } from './EventCard'
import { getAllEvents } from '../State/Restaurant/Action'

const Events = () => {
  const dispatch = useDispatch();
  const restaurant = useSelector((state) => state.restaurant) || {};
  const events = restaurant?.events || [];
  const jwt = localStorage.getItem('jwt');

  useEffect(() => {
    dispatch(getAllEvents({ jwt }));
  }, [dispatch, jwt]);

  return (
    <div className='mt-5 px-5 flex flex-wrap gap-5'>
      {events.length === 0 ? (
        <p className='text-gray-400'>No upcoming events</p>
      ) : (
        events.map((ev) => <EventCard key={ev.id || ev._id} event={ev} />)
      )}
    </div>
  )
}

export default Events