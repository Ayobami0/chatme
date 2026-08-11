type AppAvatarProps = {
  url: string;
  isActive?: boolean;
};

type AppAvatarWithNameProps = {
  name: string;
  isSelected?: boolean;
} & Omit<AppAvatarProps, 'isActive'>;

function AppAvatar() {

}


function AppAvatarWithName() {

}
