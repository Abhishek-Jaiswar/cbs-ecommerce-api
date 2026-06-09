export type TCreateAnnouncement = {
  text: string;
  link?: string | null | undefined;
  isActive?: boolean | undefined;
};

export type TUpdateAnnouncement = {
  text?: string | undefined;
  link?: string | null | undefined;
  isActive?: boolean | undefined;
};
