import { Tab, TabIndicator, TabList, Tabs } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { StepId, stepsConfig } from "../steps-config";
import { createStepPageUrl } from "../urls";

interface TabViewProps {
  activeStep: StepId;
}
const TabView = ({ activeStep }: TabViewProps) => {
  const intl = useIntl();
  const activeIndex = stepsConfig.findIndex((s) => s.id === activeStep);
  return (
    <Tabs
      isManual
      variant="unstyled"
      defaultIndex={activeIndex}
      bgColor="white"
    >
      <TabList justifyContent="center">
        {stepsConfig.map((step, idx) => (
          <Tab
            as="a"
            key={step.id}
            fontSize="lg"
            fontWeight="bold"
            px={12}
            opacity={0.55}
            _selected={{ opacity: 1 }}
            href={createStepPageUrl(step.id)}
          >
            {`${idx + 1}. ${intl.formatMessage({ id: `${step.id}-title` })}`}
          </Tab>
        ))}
      </TabList>
      <TabIndicator mt="-4px" height="4px" bg="green.500" />
    </Tabs>
  );
};

export default TabView;
