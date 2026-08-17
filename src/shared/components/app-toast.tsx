import Toast from 'react-native-toast-message';

export const toast = Toast;

const config = {

};

export const AppToast = () => {
  return (
    <Toast config={config} position='top' />
  );
};
