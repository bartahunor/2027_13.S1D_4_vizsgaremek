using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace TudasterAdmin
{
    internal static class UiStyles
    {
        private const string Ns =
            "xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation' " +
            "xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'";

        // Lekerekített gomb (a Background / BorderBrush / BorderThickness érvényesül)
        public static readonly ControlTemplate Button = (ControlTemplate)XamlReader.Parse(@"
<ControlTemplate @NS@ TargetType='Button'>
  <Border x:Name='Bd' CornerRadius='8'
          Background='{TemplateBinding Background}'
          BorderBrush='{TemplateBinding BorderBrush}'
          BorderThickness='{TemplateBinding BorderThickness}'
          Padding='{TemplateBinding Padding}'>
    <ContentPresenter HorizontalAlignment='Center' VerticalAlignment='Center'/>
  </Border>
  <ControlTemplate.Triggers>
    <Trigger Property='IsMouseOver' Value='True'>
      <Setter TargetName='Bd' Property='Opacity' Value='0.88'/>
    </Trigger>
    <Trigger Property='IsEnabled' Value='False'>
      <Setter TargetName='Bd' Property='Opacity' Value='0.45'/>
    </Trigger>
  </ControlTemplate.Triggers>
</ControlTemplate>".Replace("@NS@", Ns));

        // Lekerekített legördülő lista, lila nyíllal
        public static readonly ControlTemplate Combo = (ControlTemplate)XamlReader.Parse(@"
<ControlTemplate @NS@ TargetType='ComboBox'>
  <Grid>
    <ToggleButton Focusable='False' ClickMode='Press'
                  IsChecked='{Binding IsDropDownOpen, Mode=TwoWay, RelativeSource={RelativeSource TemplatedParent}}'
                  Background='{TemplateBinding Background}'
                  BorderBrush='{TemplateBinding BorderBrush}'
                  BorderThickness='{TemplateBinding BorderThickness}'>
      <ToggleButton.Template>
        <ControlTemplate TargetType='ToggleButton'>
          <Border CornerRadius='8'
                  Background='{TemplateBinding Background}'
                  BorderBrush='{TemplateBinding BorderBrush}'
                  BorderThickness='{TemplateBinding BorderThickness}'>
            <Path HorizontalAlignment='Right' VerticalAlignment='Center'
                  Margin='0,0,10,0' Data='M0,0 L4,4 8,0'
                  Stroke='{DynamicResource PrimaryBrush}' StrokeThickness='1.8'/>
          </Border>
        </ControlTemplate>
      </ToggleButton.Template>
    </ToggleButton>
    <ContentPresenter IsHitTestVisible='False' Margin='{TemplateBinding Padding}'
                      VerticalAlignment='Center' HorizontalAlignment='Left'
                      Content='{TemplateBinding SelectionBoxItem}'
                      ContentTemplate='{TemplateBinding SelectionBoxItemTemplate}'/>
    <Popup IsOpen='{TemplateBinding IsDropDownOpen}' Placement='Bottom'
           AllowsTransparency='True' Focusable='False' PopupAnimation='Fade'>
      <Border MinWidth='{Binding ActualWidth, RelativeSource={RelativeSource TemplatedParent}}'
              MaxHeight='{TemplateBinding MaxDropDownHeight}'
              Margin='0,4,0,8' Padding='0,4' Background='White' CornerRadius='8'
              BorderBrush='{DynamicResource BorderBrush}' BorderThickness='1'>
        <Border.Effect>
          <DropShadowEffect BlurRadius='12' ShadowDepth='2' Opacity='0.15'/>
        </Border.Effect>
        <ScrollViewer><ItemsPresenter/></ScrollViewer>
      </Border>
    </Popup>
  </Grid>
  <ControlTemplate.Triggers>
    <Trigger Property='IsEnabled' Value='False'>
      <Setter Property='Opacity' Value='0.5'/>
    </Trigger>
  </ControlTemplate.Triggers>
</ControlTemplate>".Replace("@NS@", Ns));

        // A legördülő lista elemei (lila hover / kijelölés)
        public static readonly Style ComboItem = (Style)XamlReader.Parse(@"
<Style @NS@ TargetType='ComboBoxItem'>
  <Setter Property='Padding' Value='12,8'/>
  <Setter Property='Foreground' Value='{DynamicResource TextBrush}'/>
  <Setter Property='Template'>
    <Setter.Value>
      <ControlTemplate TargetType='ComboBoxItem'>
        <Border x:Name='Bd' CornerRadius='6' Margin='4,1'
                Padding='{TemplateBinding Padding}' Background='Transparent'>
          <ContentPresenter/>
        </Border>
        <ControlTemplate.Triggers>
          <Trigger Property='IsHighlighted' Value='True'>
            <Setter TargetName='Bd' Property='Background' Value='#F1ECF8'/>
          </Trigger>
          <Trigger Property='IsSelected' Value='True'>
            <Setter TargetName='Bd' Property='Background' Value='#EAE2F5'/>
            <Setter Property='Foreground' Value='{DynamicResource PrimaryBrush}'/>
          </Trigger>
        </ControlTemplate.Triggers>
      </ControlTemplate>
    </Setter.Value>
  </Setter>
</Style>".Replace("@NS@", Ns));
    

    

        
    }
}