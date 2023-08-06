registerSettingsPage(({ settings }) => (
  <Page>
    <Section
      title={
        <Text bold align="center">
          Settings for UVwatch
        </Text>
      }
    >
      <Text>Here you can change what location is the default if no GPS is found. As well as set skin type</Text>
      <TextInput
        label="City"
        settingsKey="cityDefault"
      />
      <Select
        title={`Skin type`}
        selectViewTitle={`Skin type`}
        label={`Skin type`}
        settingsKey="SkinType"
        options={[
          {name:"I; light, pale white"},
          {name:"II; white, fair"},
          {name:"III; medium, white to olive"},
          {name:"IV; olive, moderate brown"},
          {name:"V; brown, dark brown"},
          {name:"VI; black, very dark brown to black"}
        ]}
      />
    </Section>
  </Page>
));
