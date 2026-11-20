export const SANITIZE_TAGS = ['p','br','strong','em','b','i','ul','ol','li','h2','h3','a','img'] as const;
export const SANITIZE_ATTRS = { a: ['href','target','rel'], img: ['src','alt','loading'] } as const;
