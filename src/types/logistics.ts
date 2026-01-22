export type TruckDelivery = {
  receipt_code: string;
  customer_name: string;
  due_date: string;
  sub_total: number;
  remand_price: number;
  total: number;
  status: number;
};

export type DeliveryAnalytics = {
  id: string;
  value: number;
  month: string;
  status: string;
};

export type Truck = {
  truck_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  color: string;
  status: string;
  availability: boolean;
  origin: string;
  destination: string;
  progress: number;
};

export type DeliveryRequest = {
  id: string;
  name: string;
  pickup_location: string;
  delivery_location: string;
  delivery_date: string;
  delivery_time: number;
  truck_type: 'small' | 'medium' | 'large' | string;
  cargo_weight: number;
  delivery_status: 'pending' | 'in transit' | 'delivered' | string;
  driver_name: string;
  contact_number: string;
};
