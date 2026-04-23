export type PickupCancelledBy = {
	name?: string | null;
	role?: string | null;
};

export type PickupLocation = {
	latitude?: number;
	longitude?: number;
};

export type PickupItem = {
	itemId?: string;
	label?: string;
	name?: string;
	heading?: string;
	price?: number;
	newQtyPrice?: number;
	unit?: string;
	quantity?: number;
	qty?: number;
};

export type PickupRecord = {
	_id: string;
	appCustomerId?: string;
	platform_type?: string;
	tempPickupAdresssId?: string;
	tempDeliveryAddressId?: string;
	Name?: string;
	Contact?: string;
	Address?: string;
	deliveryAddress?: string;
	slot?: string;
	PickupStatus?: string;
	type?: string;
	isDeleted?: boolean;
	cancelNote?: string | null;
	cancelVoice?: string | null;
	cancelledAt?: string | null;
	cancelledBy?: PickupCancelledBy;
	rescheduledDate?: string | null;
	isRescheduled?: boolean;
	pickup_date?: string;
	plantName?: string;
	contactName?: string;
	contactPhone?: string;
	note?: string;
	createdAt?: string;
	updatedAt?: string;
	riderDate?: string;
	riderName?: string;
	pickupLocation?: PickupLocation;
	deliveryLocation?: PickupLocation;
	paymentStatus?: string;
	isPaid?: boolean;
	price?: number;
	totalAmount?: number;
	items?: PickupItem[];
};

export type PickupResponse = {
	pickups?: PickupRecord[];
	message?: string;
};

