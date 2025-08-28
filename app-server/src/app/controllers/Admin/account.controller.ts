import { Request, Response } from "express";

export const updatePassword = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};
export const updateAccount = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};
export const updateAccountEmail = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};
