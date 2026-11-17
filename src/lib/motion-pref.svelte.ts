const KEY = 'aj-motion';

function apply(off: boolean) {
	if (off) document.documentElement.dataset.motion = 'off';
	else delete document.documentElement.dataset.motion;
}

export function motionOff(): boolean {
	if (typeof document === 'undefined') return false;
	return (
		document.documentElement.dataset.motion === 'off' ||
		matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

class MotionPref {
	off = $state(false);

	init() {
		try {
			this.off = localStorage.getItem(KEY) === 'off';
		} catch {
			this.off = document.documentElement.dataset.motion === 'off';
		}
		apply(this.off);
	}

	toggle() {
		this.off = !this.off;
		apply(this.off);
		try {
			localStorage.setItem(KEY, this.off ? 'off' : 'on');
		} catch {
			return;
		}
	}
}

export const motionPref = new MotionPref();
