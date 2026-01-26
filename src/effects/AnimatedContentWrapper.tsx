import React from "react";
import AnimatedContent from "./AnimatedContent";

type AnimatedContentWrapperProps = React.ComponentProps<typeof AnimatedContent>;

export default function AnimatedContentWrapper({
  distance = 24,
  duration = 0.6,
  delay = 0.05,
  ...props
}: AnimatedContentWrapperProps) {
  return <AnimatedContent distance={distance} duration={duration} delay={delay} {...props} />;
}
