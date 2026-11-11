import type { ParamMatcher } from '@sveltejs/kit';
import { UUID } from '$lib/uuid';

export const match: ParamMatcher = (param) => UUID.test(param);
