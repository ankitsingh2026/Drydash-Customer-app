export type Item = {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
  mainHeading?: string;
  mainDescription?: string;
  description?: string;
  displayPrice?: string;
  unit?: string;
  type?: string;
  process?: Array<{ step: number; heading: string; description: string }>;
};

const S3_BASE =
  "https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images";
const BASE =
  "https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images/dryclean";

const SHOE_BASE =
  "https://drydash-app-images.s3.ap-south-1.amazonaws.com/service-catalog/sheo-spa";

const LAUNDRY_BASE =
  "https://drydash-app-images.s3.ap-south-1.amazonaws.com/service-catalog/laundry";

export const catalogData: Record<string, Item[]> = {
  shoe: [
    {
      id: "shoe-4",
      title: "Sport Shoes / Sneakers",
      price: 500,
      category: "Shoe Spa",
      image: `${SHOE_BASE}/shoe_1.png`,
    },
    {
      id: "shoe-5",
      title: "Leather Shoes",
      price: 600,
      category: "Shoe Spa",
      image: `${SHOE_BASE}/shoe_2.png`,
    },
    {
      id: "shoe-6",
      title: "Suede Shoes",
      price: 600,
      category: "Shoe Spa",
      image: `${SHOE_BASE}/shoe_3.png`,
    },
    {
      id: "shoe-7",
      title: "Boots",
      price: 700,
      category: "Shoe Spa",
      image: `${SHOE_BASE}/shoe_7.png`,
    },
    {
      id: "shoe-8",
      title: "Stilettos",
      price: 600,
      category: "Shoe Spa",
      image: `${SHOE_BASE}/shoe_8.png`,
    },
    {
      id: "shoe-9",
      title: "Sliders",
      price: 250,
      category: "Shoe Spa",
      image: `${SHOE_BASE}/shoe_9.png`,
    },
    {
      id: "shoe-10",
      title: "Sandals",
      price: 300,
      category: "Shoe Spa",
      image: `${SHOE_BASE}/shoe_10.png`,
    },
  ],

  laundry: [
    {
      id: "laundry-1",
      title: "W & F (Wearables)",
      price: 80,
      category: "Laundry",
      image: `${LAUNDRY_BASE}/laundry_1.png`,
    },
    {
      id: "laundry-2",
      title: "W & F (Non-Wearables)",
      price: 100,
      category: "Laundry",
      image: `${LAUNDRY_BASE}/laundry_2.png`,
    },
    {
      id: "laundry-3",
      title: "W & I (Wearables)",
      price: 100,
      category: "Laundry",
      image: `${LAUNDRY_BASE}/laundry_3.png`,
    },
    {
      id: "laundry-4",
      title: "W & I (Non-Wearables)",
      price: 120,
      category: "Laundry",
      image: `${LAUNDRY_BASE}/laundry_4.png`,
    },
  ],

  dryclean: [
    {
      id: "dryclean-1",
      title: "Shirt/T-shirt",
      price: 100,
      category: "DryClean",
      image: `${BASE}/dryclean_1.png`,
    },
    {
      id: "dryclean-2",
      title: "Jeans",
      price: 120,
      category: "DryClean",
      image: `${BASE}/dryclean_2.png`,
    },
    {
      id: "dryclean-3",
      title: "Trousers",
      price: 100,
      category: "DryClean",
      image: `${BASE}/dryclean_3.png`,
    },
    {
      id: "dryclean-4",
      title: "Blazer/Jacket",
      price: 250,
      category: "DryClean",
      image: `${BASE}/dryclean_4.png`,
    },
    {
      id: "dryclean-5",
      title: "3 Piece Suit",
      price: 450,
      category: "DryClean",
      image: `${BASE}/dryclean_5.png`,
    },
    {
      id: "dryclean-6",
      title: "2 Piece Suit",
      price: 300,
      category: "DryClean",
      image: `${BASE}/dryclean_6.png`,
    },
    {
      id: "dryclean-7",
      title: "Long Blazer",
      price: 350,
      category: "DryClean",
      image: `${BASE}/dryclean_7.png`,
    },
    {
      id: "dryclean-8",
      title: "Sweatshirt / Hoodie",
      price: 250,
      category: "DryClean",
      image: `${BASE}/dryclean_8.png`,
    },
    {
      id: "dryclean-9",
      title: "Winter Jacket",
      price: 350,
      category: "DryClean",
      image: `${BASE}/dryclean_9.png`,
    },
    {
      id: "dryclean-10",
      title: "Heavy Saree",
      price: 350,
      category: "DryClean",
      image: `${BASE}/dryclean_10.png`,
    },
    {
      id: "dryclean-11",
      title: "Medium Saree",
      price: 300,
      category: "DryClean",
      image: `${BASE}/dryclean_11.png`,
    },
    {
      id: "dryclean-12",
      title: "Saree",
      price: 250,
      category: "DryClean",
      image: `${BASE}/dryclean_12.png`,
    },
    {
      id: "dryclean-13",
      title: "Blouse",
      price: 80,
      category: "DryClean",
      image: `${BASE}/dryclean_13.png`,
    },
    {
      id: "dryclean-14",
      title: "Heavy Blouse",
      price: 120,
      category: "DryClean",
      image: `${BASE}/dryclean_14.png`,
    },
    {
      id: "dryclean-15",
      title: "Lehnga",
      price: 250,
      category: "DryClean",
      image: `${BASE}/dryclean_15.png`,
    },
    {
      id: "dryclean-16",
      title: "Medium Lehnga",
      price: 500,
      category: "DryClean",
      image: `${BASE}/dryclean_16.png`,
    },
    {
      id: "dryclean-17",
      title: "Heavy Lehnga",
      price: 700,
      category: "DryClean",
      image: `${BASE}/dryclean_17.png`,
    },
    {
      id: "dryclean-18",
      title: "Heavy Dress",
      price: 500,
      category: "DryClean",
      image: `${BASE}/dryclean_18.png`,
    },
    {
      id: "dryclean-19",
      title: "Dress",
      price: 350,
      category: "DryClean",
      image: `${BASE}/dryclean_19.png`,
    },
    {
      id: "dryclean-20",
      title: "Heavy Gown",
      price: 300,
      category: "DryClean",
      image: `${BASE}/dryclean_20.png`,
    },
    {
      id: "dryclean-21",
      title: "Gown",
      price: 200,
      category: "DryClean",
      image: `${BASE}/dryclean_21.png`,
    },
    {
      id: "dryclean-22",
      title: "Dupatta",
      price: 80,
      category: "DryClean",
      image: `${BASE}/dryclean_22.png`,
    },
    {
      id: "dryclean-23",
      title: "Heavy Dupatta",
      price: 100,
      category: "DryClean",
      image: `${BASE}/dryclean_23.png`,
    },
    {
      id: "dryclean-24",
      title: "Kurta Pyjama",
      price: 250,
      category: "DryClean",
      image: `${BASE}/dryclean_24.png`,
    },
    {
      id: "dryclean-25",
      title: "Shawl",
      price: 200,
      category: "DryClean",
      image: `${BASE}/dryclean_25.png`,
    },
    {
      id: "dryclean-26",
      title: "Sweater / Cardigan",
      price: 200,
      category: "DryClean",
      image: `${BASE}/dryclean_26.png`,
    },
    {
      id: "dryclean-27",
      title: "Shrug",
      price: 200,
      category: "DryClean",
      image: `${BASE}/dryclean_27.png`,
    },
    {
      id: "dryclean-28",
      title: "Leather Jackets",
      price: 450,
      category: "DryClean",
      image: `${BASE}/dryclean_28.png`,
    },
    {
      id: "dryclean-29",
      title: "Belt",
      price: 150,
      category: "DryClean",
      image: `${BASE}/dryclean_29.png`,
    },
    {
      id: "dryclean-30",
      title: "Leather Belt",
      price: 250,
      category: "DryClean",
      image: `${BASE}/dryclean_30.png`,
    },
    {
      id: "dryclean-31",
      title: "Pillow Cover",
      price: 50,
      category: "DryClean",
      image: `${BASE}/dryclean_31.png`,
    },
    {
      id: "dryclean-32",
      title: "Large Pillow",
      price: 100,
      category: "DryClean",
      image: `${BASE}/dryclean_32.png`,
    },
    {
      id: "dryclean-33",
      title: "Small Pillow",
      price: 60,
      category: "DryClean",
      image: `${BASE}/dryclean_33.png`,
    },
    {
      id: "dryclean-34",
      title: "Blanket (Single)",
      price: 300,
      category: "DryClean",
      image: `${BASE}/dryclean_34.png`,
    },
    {
      id: "dryclean-35",
      title: "Blanket (Double)",
      price: 400,
      category: "DryClean",
      image: `${BASE}/dryclean_35.png`,
    },
    {
      id: "dryclean-36",
      title: "Duvet (Single)",
      price: 300,
      category: "DryClean",
      image: `${BASE}/dryclean_36.png`,
    },
    {
      id: "dryclean-37",
      title: "Duvet (Double)",
      price: 400,
      category: "DryClean",
      image: `${BASE}/dryclean_37.png`,
    },
    {
      id: "dryclean-38",
      title: "Quilt (Single)",
      price: 350,
      category: "DryClean",
      image: `${BASE}/dryclean_38.png`,
    },
    {
      id: "dryclean-39",
      title: "Quilt (Double)",
      price: 450,
      category: "DryClean",
      image: `${BASE}/dryclean_39.png`,
    },
    {
      id: "dryclean-40",
      title: "Bed Cover (Single)",
      price: 250,
      category: "DryClean",
      image: `${BASE}/dryclean_40.png`,
    },
    {
      id: "dryclean-41",
      title: "Bed Cover (Double)",
      price: 350,
      category: "DryClean",
      image: `${BASE}/dryclean_41.png`,
    },
    {
      id: "dryclean-42",
      title: "Bed Sheet (Single)",
      price: 200,
      category: "DryClean",
      image: `${BASE}/dryclean_42.png`,
    },
    {
      id: "dryclean-43",
      title: "Bed Sheet (Double)",
      price: 300,
      category: "DryClean",
      image: `${BASE}/dryclean_43.png`,
    },
    {
      id: "dryclean-44",
      title: "Handbag (Small)",
      price: 300,
      category: "DryClean",
      image: `${BASE}/dryclean_44.png`,
    },
    {
      id: "dryclean-45",
      title: "Handbag (Medium)",
      price: 450,
      category: "DryClean",
      image: `${BASE}/dryclean_45.png`,
    },
    {
      id: "dryclean-46",
      title: "Handbag (Large)",
      price: 450,
      category: "DryClean",
      image: `${BASE}/dryclean_46.png`,
    },
    {
      id: "dryclean-47",
      title: "Sports Bag",
      price: 400,
      category: "DryClean",
      image: `${BASE}/dryclean_47.png`,
    },
    {
      id: "dryclean-48",
      title: "Leather Bag (Small)",
      price: 400,
      category: "DryClean",
      image: `${BASE}/dryclean_48.png`,
    },
    {
      id: "dryclean-49",
      title: "Leather Bag (Large)",
      price: 700,
      category: "DryClean",
      image: `${BASE}/dryclean_49.png`,
    },
  ],
};
