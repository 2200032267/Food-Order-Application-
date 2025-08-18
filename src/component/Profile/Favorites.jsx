import React from 'react'
import { useSelector } from 'react-redux';
import RestaurantCard from '../Restaurant/RestaurantCard'

export const Favorites = () => {
  const {auth} = useSelector(store => store);
  return (
    <div>
    <h1 className='py-5 text-xl text-semibold text-center'>My Favorites</h1>
    <div className='flex justify-center gap-3 flex-wrap'>
      {auth.favorites.map((item) => <RestaurantCard item={item}/>)}

    </div>
    </div>
  )
}

