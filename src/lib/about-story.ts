export type Variant = 'text' | 'now' | 'next';
export type Chapter = { id: string; kicker: string; big: string; text: string; variant: Variant };

export const chapters: Chapter[] = [
	{
		id: 'origin',
		variant: 'text',
		kicker: 'Origin',
		big: 'Jakarta.',
		text: 'I am Abdul Jawad Azizi, a full-stack developer based in Jakarta. I build whole products, from the interface to the database to the deploy.'
	},
	{
		id: 'first-shipped',
		variant: 'text',
		kicker: 'First shipped',
		big: '30% less admin work.',
		text: 'At Venturo I built a Vue and Laravel admin dashboard that cut manual admin work by 30%.'
	},
	{
		id: 'turning-point',
		variant: 'text',
		kicker: 'Turning point',
		big: '19M users.',
		text: 'At Freecause I am rebuilding a 19M-user petition platform from scratch, with edge caching, versioned invalidation and no downtime.'
	},
	{
		id: 'how-i-work',
		variant: 'text',
		kicker: 'How I work',
		big: 'Own the whole seam.',
		text: 'I would rather be solid across every layer than perfect in one. I keep things boring, ship in small steps, and make deploys easy to undo.'
	},
	{
		id: 'now',
		variant: 'now',
		kicker: 'Now',
		big: 'Two things at once.',
		text: 'At Telkom Akses I own three backend services and the UI of a nationwide workforce platform, while the Freecause rebuild continues.'
	},
	{
		id: 'next',
		variant: 'next',
		kicker: 'Next',
		big: 'Your turn.',
		text: 'If something here fits what you are building, I would like to hear about it.'
	}
];
