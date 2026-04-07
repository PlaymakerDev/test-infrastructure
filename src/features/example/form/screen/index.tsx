"use client"
import React, { useMemo, useState } from 'react'
import { FormSearch, FormSubmit } from '../components'
import { Button } from 'antd'

interface Props {

}

const FormScreen: React.FC<Props> = (props) => {
  const { } = props
  const [type, setType] = useState<"SEARCH" | "SUBMIT" | "GRID">("SEARCH")

  const renderContent = useMemo(() => {
    switch (type) {
      case "SEARCH":
        return <FormSearch />;
      case "SUBMIT":
        return <FormSubmit />;
      default:
        return null;
    }
  }, [type]);

  return (
    <div>
      <div>
        <h1>Select Type: </h1>
        <Button
          type={type === "SEARCH" ? 'primary' : 'default'}
          onClick={() => setType("SEARCH")}
          className='mr-2'
        >
          Search
        </Button>
        <Button
          type={type === "SUBMIT" ? 'primary' : 'default'}
          onClick={() => setType("SUBMIT")}
          className='mr-2'
        >
          Submit
        </Button>
      </div>
      <div className='mt-5'>
        <h2>Content: </h2>
        {renderContent}
      </div>
    </div>
  )
}

export default React.memo<Props>(FormScreen)
