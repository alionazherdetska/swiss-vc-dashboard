import React from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Handshake } from '../common/CustomIcons';

// Custom palette
const PALETTE = {
	red: '#E84A5F', // Primary Red
	orange: '#FF6B35', // Orange
	yellow: '#F7931E', // Yellow
	green: '#2ECC71', // Green
	blue: '#3498DB', // Blue
	purple: '#9B59B6', // Purple
	teal: '#1ABC9C', // Teal
	gray: '#7F8C8D', // Gray
};

const MetricsCards = ({ filteredDeals }) => {
	// Calculate total volume for deals
	const totalVolume = filteredDeals
		.filter((d) => d.Amount)
		.reduce((sum, d) => sum + d.Amount, 0);

	const avgDealSize =
		filteredDeals.filter((d) => d.Amount).length > 0
			? totalVolume / filteredDeals.filter((d) => d.Amount).length
			: 0;

	return (
		<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
			{/* Total Deals */}
			<div
				className='p-4 rounded-lg border transition-all'
				style={{ background: '#E8F4FB', borderColor: PALETTE.blue }}
			>
				<div className='flex items-center'>
					<Handshake
						className='h-6 w-6 mr-3'
						style={{ color: PALETTE.blue }}
					/>
					<div>
						<p className='text-sm text-gray-600'>Total Deals</p>
						<p
							className='text-2xl font-bold'
							style={{ color: PALETTE.blue }}
						>
							{filteredDeals.length.toLocaleString()}
						</p>
					</div>
				</div>
			</div>

			{/* Total Volume */}
			<div
				className='p-4 rounded-lg border transition-all'
				style={{ background: '#E6F9F0', borderColor: PALETTE.green }}
			>
				<div className='flex items-center'>
					<TrendingUp
						className='h-6 w-6 mr-3'
						style={{ color: PALETTE.green }}
					/>
					<div>
						<p className='text-sm text-gray-600'>Total Volume</p>
						<p
							className='text-xl font-bold'
							style={{ color: PALETTE.green }}
						>
							{totalVolume.toFixed(1)}M CHF
						</p>
					</div>
				</div>
			</div>

			{/* Average Deal Size */}
			<div
				className='p-4 rounded-lg border transition-all'
				style={{ background: '#F3EAFB', borderColor: PALETTE.purple }}
			>
				<div className='flex items-center'>
					<DollarSign
						className='h-6 w-6 mr-3'
						style={{ color: PALETTE.purple }}
					/>
					<div>
						<p className='text-sm text-gray-600'>Avg Deal Size</p>
						<p
							className='text-xl font-bold'
							style={{ color: PALETTE.purple }}
						>
							{avgDealSize > 0 ? `${avgDealSize.toFixed(1)}M CHF` : 'N/A'}
						</p>
					</div>
				</div>
			</div>

			{/* Deals with Amount */}
			<div
				className='p-4 rounded-lg border transition-all'
				style={{ background: '#FFF6E5', borderColor: PALETTE.orange }}
			>
				<div className='flex items-center'>
					<Calendar
						className='h-6 w-6 mr-3'
						style={{ color: PALETTE.orange }}
					/>
					<div>
						<p className='text-sm text-gray-600'>With Amount</p>
						<p
							className='text-2xl font-bold'
							style={{ color: PALETTE.orange }}
						>
							{filteredDeals.filter((d) => d.Amount).length.toLocaleString()}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MetricsCards;
