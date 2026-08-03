export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Only overwrite body/params — req.query is a getter-only in Express v5
            if (parsed.body !== undefined)
                req.body = parsed.body;
            if (parsed.params !== undefined) {
                Object.assign(req.params, parsed.params);
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
export default validate;
