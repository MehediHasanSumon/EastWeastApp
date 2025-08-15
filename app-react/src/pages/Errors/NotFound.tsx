import BaseErrorPage from "../../layouts/BaseErrorPage";

const NotFound = () => (
  <BaseErrorPage
    errorCode="404"
    title="Page Not Found"
    description="The page you're looking for doesn't exist or has been moved."
    additionalContent={
      <p className="text-xs text-gray-500 dark:text-gray-500">Try checking the URL or searching for what you need</p>
    }
  />
);
export default NotFound;
