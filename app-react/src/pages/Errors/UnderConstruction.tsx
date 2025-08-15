import BaseErrorPage from "../../layouts/BaseErrorPage";

const UnderConstruction = () => {
  return (
    <BaseErrorPage
      errorCode="🚧"
      title="Under Construction"
      description="We're building something awesome here! Please check back soon."
      showHomeButton={true}
      additionalContent={
        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Expected launch date:</p>
          <div className="inline-block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
            <span className="font-bold text-blue-600 dark:text-blue-400">June 30, 2023</span>
          </div>
        </div>
      }
    />
  );
};

export default UnderConstruction;
