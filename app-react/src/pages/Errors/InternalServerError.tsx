import BaseErrorPage from "../../layouts/BaseErrorPage";

const InternalServerError = () => {
  return (
    <BaseErrorPage
      errorCode="500"
      title="Internal Server Error"
      description="Something went wrong on our end. We're working to fix it. Please try again later."
      additionalContent={
        <p className="text-xs text-gray-500 dark:text-gray-500">Our team has been notified about this issue</p>
      }
    />
  );
};

export default InternalServerError;
