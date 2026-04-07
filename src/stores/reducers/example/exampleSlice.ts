import { getExampleAPI } from '@/services/routes/ExampleService';
import { ExampleState } from '@/types/example';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const initialState: ExampleState = {
  me: {
    user_id: ""
  },
  task_schedules: {
    me: {
      loading: false,
      status: 'IDLE'
    }
  }
}

export const SLICE_NAME = 'exampleSlice';

export const getExampleData = createAsyncThunk(SLICE_NAME + '/API_GET_EXAMPLE', async () => {
  // assume someService required reesponse & require type as generic
  const response = await getExampleAPI()
  return response.data
})

const exampleSlice = createSlice({
  name: `${SLICE_NAME}/example`,
  initialState,
  reducers: {
    setMe: (state, action) => {
      state.me = action.payload
    },
    resetMe: (state) => {
      state.me = initialState.me
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getExampleData.fulfilled, (state, action) => {
        state.me = action.payload
        state.task_schedules.me.loading = false
        state.task_schedules.me.status = 'SUCCESS'
      })
      .addCase(getExampleData.pending, (state) => {
        state.task_schedules.me.loading = true
        state.task_schedules.me.status = 'LOADING'
      })
      .addCase(getExampleData.rejected, (state) => {
        state.task_schedules.me.loading = false
        state.task_schedules.me.status = 'FAILED'
      })
  }
})

export const {
  setMe,
  resetMe,
} = exampleSlice.actions

export default exampleSlice.reducer