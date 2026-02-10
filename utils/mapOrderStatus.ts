export const mapOrderStatus = (status:string) => {
  switch(status){
    case "assigned": return "Picked Up";
    case "in_transit": return "In Transit";
    case "processing": return "Processing";
    case "washing": return "Washing";
    default: return null;
  }
}
