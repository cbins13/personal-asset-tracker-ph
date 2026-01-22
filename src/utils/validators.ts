export const isMongoObjectId = (value?: string): boolean => !!value && /^[a-fA-F0-9]{24}$/.test(value);
