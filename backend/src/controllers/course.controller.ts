import { Request, Response } from 'express';

export const getCourses = async (req: Request, res: Response) => {
    res.json({ message: "Get courses endpoint" });
};
