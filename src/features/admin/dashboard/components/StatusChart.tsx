import { Col, Row } from 'antd'
import React, { useCallback } from 'react'
import { TbCamera, TbMapPin, TbRoad } from "react-icons/tb";

interface Props {

}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StatusChart: React.FC<Props> = (props) => {
  const { } = props
  const data: CardProps[] = [
    {
      icon: <TbCamera className='text-4xl text-(--yellow)' />,
      title: '1255',
      description: 'จุดติดตั้ง'
    },
    {
      icon: <TbMapPin className='text-4xl text-(--yellow)' />,
      title: '1255',
      description: 'สายทาง'
    },
    {
      icon: <TbRoad className='text-4xl text-(--yellow)' />,
      title: '1255',
      description: 'สายทาง'
    },
  ]

  const renderStatCard = useCallback((cardProps: CardProps) => {
    const { icon, title, description } = cardProps
    return (
      <div className='bg-[#B8CDB533] p-3 rounded-lg flex flex-col items-center'>
        <figure className='bg-(--dark-black) p-3 lg:p-5 rounded-md'>
          {icon}
        </figure>
        <div className='mt-3 text-center'>
          <h1 className='text-(--yellow)'>{title}</h1>
          <p className='text-(--yellow)'>{description}</p>
        </div>
      </div>
    )
  }, [])

  return (
    <Row gutter={[16, 16]}>
      {data.map((item, index) => (
        <Col key={index} xs={8} sm={8} md={8} lg={8} xl={8} xxl={8}>
          {renderStatCard(item)}
        </Col>
      ))}
    </Row>
  )
}

export default React.memo<Props>(StatusChart)
