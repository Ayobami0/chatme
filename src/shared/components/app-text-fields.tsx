import { TextInputProps } from "react-native";

type AppTextFieldProps = {} & TextInputProps;

type AppControlledTextFieldProps = {} & AppTextFieldProps;

function AppTextField(props: AppTextFieldProps) {}

function AppPhoneTextField(props: AppTextFieldProps) {}

function AppSearchTextField(props: AppTextFieldProps) {}

function AppControlledTextField(props: AppControlledTextFieldProps) {}

function AppControlledPhoneTextField(props: AppControlledTextFieldProps) {}
